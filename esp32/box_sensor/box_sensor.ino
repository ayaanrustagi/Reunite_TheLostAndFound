/*
 * REUNITE — Drop Box Fill Sensor
 * FBLA Website Coding & Development (2025–2026)
 *
 * Hardware: ESP32 DevKit (38-pin WROOM-32) + VL53L0X time-of-flight
 * distance sensor, mounted at the top of a physical lost-and-found box,
 * pointed straight down at the contents.
 *
 * What it does:
 *   1. Takes 5 distance readings every cycle and averages the valid ones
 *      (reduces noise from uneven piles of soft items like jackets/bags).
 *   2. Converts distance-from-empty into a fill percentage using the
 *      box's known empty-to-sensor height (BOX_HEIGHT_MM, measured by hand).
 *   3. POSTs { deviceId, fillPercent } as JSON to the REUNITE backend's
 *      /api/sensors/box-status route.
 *   4. The backend (see backend/controllers/sensorController.js) stores
 *      the reading, updates the admin dashboard in real time, and — if
 *      fill crosses a configurable threshold — emails an admin alert
 *      (with a cooldown so it doesn't spam).
 *
 * Why VL53L0X over a cheaper ultrasonic (HC-SR04) sensor:
 *   Ultrasonic sensors bounce sound waves and give noisy/erratic readings
 *   off soft, sound-absorbing surfaces (fabric, jackets). The VL53L0X uses
 *   a laser time-of-flight measurement instead, which stays accurate on
 *   uneven, soft piles — exactly what a lost-and-found box is full of.
 *
 * Libraries used (see ../../SOURCES.md for full attribution):
 *   - Adafruit_VL53L0X  (sensor driver)
 *   - WiFi / HTTPClient (built into the Arduino-ESP32 core)
 *
 * Wiring (I2C):
 *   VL53L0X VIN   -> ESP32 3V3
 *   VL53L0X GND   -> ESP32 GND
 *   VL53L0X SCL   -> ESP32 GPIO22 (D22)
 *   VL53L0X SDA   -> ESP32 GPIO21 (D21)
 *   VL53L0X XSHUT -> ESP32 3V3 (holds the sensor out of standby —
 *                     required on clone breakouts without an onboard
 *                     pull-up; Adafruit's official board doesn't need this)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_VL53L0X.h>

// ── Configuration — fill these in before flashing ──────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "https://thereunite.vercel.app/api/sensors/box-status";
const char* DEVICE_ID     = "campcamp-box1";

// Measure this by hand: distance in mm from the sensor (mounted at the
// inside top of the lid) straight down to the empty box's bottom.
const int BOX_HEIGHT_MM = 400;

// How often to take a reading and report it. 5 seconds is good for live
// testing/demoing; once everything's confirmed working, stretch this out
// (e.g. 5UL * 60UL * 1000UL for every 5 minutes) so the box isn't hammering
// WiFi and the backend constantly.
const unsigned long REPORT_INTERVAL_MS = 5000;
// ─────────────────────────────────────────────────────────────────────

Adafruit_VL53L0X lox = Adafruit_VL53L0X();

void setup() {
    Serial.begin(115200);
    delay(1000);

    Wire.begin(21, 22); // SDA, SCL

    Serial.println("Initializing VL53L0X...");
    if (!lox.begin()) {
        Serial.println("FAILED to find VL53L0X. Check wiring.");
        while (1) delay(1000);
    }
    Serial.println("Sensor found.");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("Connected. IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println();
        Serial.println("WiFi failed to connect — will keep retrying in loop().");
    }
}

void loop() {
    long total = 0;
    int valid = 0;

    for (int i = 0; i < 5; i++) {
        VL53L0X_RangingMeasurementData_t measure;
        lox.rangingTest(&measure, false);

        if (measure.RangeStatus != 4 && measure.RangeMilliMeter < BOX_HEIGHT_MM) {
            total += measure.RangeMilliMeter;
            valid++;
        }
        delay(100);
    }

    if (valid > 0) {
        float avgMM = (float)total / valid;
        float fillPercent = constrain((BOX_HEIGHT_MM - avgMM) / (float)BOX_HEIGHT_MM * 100.0, 0, 100);

        Serial.printf("Distance: %.1fmm | Fill: %.1f%%\n", avgMM, fillPercent);
        reportFillLevel(fillPercent);
    } else {
        Serial.println("No valid readings this cycle.");
    }

    delay(REPORT_INTERVAL_MS);
}

void reportFillLevel(float fillPercent) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected — skipping upload, reconnecting...");
        WiFi.reconnect();
        return;
    }

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    String payload = String("{\"deviceId\":\"") + DEVICE_ID +
                      "\",\"fillPercent\":" + String(fillPercent, 1) + "}";

    int httpCode = http.POST(payload);
    Serial.printf("POST status: %d\n", httpCode);
    http.end();
}
