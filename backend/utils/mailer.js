// Server-side email alerts for the lost-and-found box sensor.
//
// Uses Gmail SMTP via an App Password (free, no third-party signup needed).
// Mirrors the rest of the app's graceful-degradation philosophy (see Groq
// AI match mode and the Mongo → in-memory fallback in backend/db.js):
// if email isn't configured, the alert is logged to the console instead of
// crashing the request.
//
// Required .env vars (all optional — alerting just no-ops if missing):
//   ALERT_EMAIL_USER       Gmail address to send FROM
//   ALERT_EMAIL_APP_PASS   Gmail App Password (NOT your regular password —
//                           generate one at https://myaccount.google.com/apppasswords)
//   ALERT_EMAIL_TO         Address to send the "box is full" alert TO

let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch {
    nodemailer = null;
}

function getTransporter() {
    if (!nodemailer) return null;
    const { ALERT_EMAIL_USER, ALERT_EMAIL_APP_PASS } = process.env;
    if (!ALERT_EMAIL_USER || !ALERT_EMAIL_APP_PASS) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: ALERT_EMAIL_USER, pass: ALERT_EMAIL_APP_PASS }
    });
}

async function sendBoxFullAlert({ deviceId, fillPercent, location }) {
    const transporter = getTransporter();
    const to = process.env.ALERT_EMAIL_TO;

    if (!transporter || !to) {
        console.log(`[ALERT] (email not configured) Box "${deviceId}" is at ${fillPercent}% — would have emailed ${to || '(no recipient set)'}`);
        return { sent: false, reason: 'email not configured' };
    }

    try {
        await transporter.sendMail({
            from: process.env.ALERT_EMAIL_USER,
            to,
            subject: `REUNITE: Lost & Found box "${deviceId}" needs emptying`,
            text: `Box "${deviceId}"${location ? ` (${location})` : ''} is at ${fillPercent}% capacity.\n\nLog in to the REUNITE admin dashboard to confirm and clear it.`
        });
        console.log(`[ALERT] Email sent to ${to} for box "${deviceId}" at ${fillPercent}%`);
        return { sent: true };
    } catch (err) {
        console.error('[ALERT] Failed to send box-full email:', err.message);
        return { sent: false, reason: err.message };
    }
}

module.exports = { sendBoxFullAlert };
