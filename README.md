# REUNITE — The Intelligent Lost & Found Network

**FBLA Website Coding & Development (2025–2026)**
**Developed by**: Ayaan Rustagi, Sree Kondapali, Tushaar Singh
**School**: Rouse High School
**Tech Stack**: Node.js, Express, MongoDB, Vanilla JavaScript, CSS3

## Executive Summary

REUNITE is a full-stack web application designed to solve the friction of lost
and found management in high-density environments like schools and community
centers. Unlike static registries, REUNITE pairs an on-device perceptual
matching engine with an optional AI image-matching mode to connect lost reports
to found inventory.

## Design Philosophy: "Liquid Glass"

We moved away from generic templates to build a custom Liquid Glass design system.

- **Glassmorphism**: Layered transparency with `backdrop-filter: blur()` for depth.
- **Bento Logic**: Dashboards use a proportional "Bento Grid" for high information density without clutter.
- **Micro-interactions**: Hardware-accelerated animations using CSS `transform` and `opacity` to keep performance smooth on low-end devices.

## Technical Architecture (MVC)

REUNITE follows the Model-View-Controller architecture to keep the codebase scalable and maintainable.

### 1. Two-Tier Visual Search

REUNITE offers two matching modes on the Find Items page:

- **Fast (on-device d-hash)** — `js/forms.js`, `js/utils.js`: A custom-built
  Difference Hashing algorithm converts images into structural hashes and
  compares them with Hamming distance plus dominant-color scoring. Runs entirely
  in the browser, no network required.
- **Accurate (AI)** — `backend/routes/match.js`: Sends the photo and inventory
  candidates to the **Groq API** running **Llama 4 Scout** (multimodal) for a
  same-item visual comparison. Degrades gracefully to Fast mode if no API key is
  configured or the service is unreachable.
- **Levenshtein Distance**: Fuzzy text matching accounts for typos in item titles (e.g., "Iphone" matching "iPhone").

> The d-hash / Levenshtein logic is original work. The Accurate mode relies on a
> third-party API; see [SOURCES.md](./SOURCES.md) for full attribution.

### 2. The Backend (`server.js` & `backend/`)

- **Node.js/Express API**: A REST API that handles all data reconciliation.
- **Hybrid Data Persistence**: MongoDB (Mongoose) for primary storage with an
  automatic in-memory fallback (`mongodb-memory-server`) so the app still runs
  for local evaluation when no database is configured.
- **Security Protocols**:
  - Server-side role verification for administrators.
  - One-time-password (OTP) email verification via EmailJS.
  - Payload limiting (50MB) to guard against oversized-upload abuse.

### 3. The Audit Log System

Every administrative decision (Approve, Reject, Claim) is recorded in an Audit Log, creating a professional-grade paper trail for accountability.

## Universal Design & Accessibility

REUNITE features a custom accessibility panel that adapts the interface to user
needs without a page refresh:

- **Text-to-Speech**: Reads UI text aloud on hover *or* keyboard focus using the Web Speech API.
- **Reduced Motion**: Disables non-essential animations for users with vestibular sensitivities.
- **High Contrast Mode**: Boosts color contrast ratios for low-vision users.
- **Dynamic Text Scaling**: Font scaling across the entire UI.
- **ARIA & Keyboard Support**: Logical tab flow, ARIA labels, and a "Skip to Content" link.

## Responsive Performance

Built with a mobile-first mentality:

- **Breakpoint Logic**: Custom media queries for mobile, tablet, and desktop.
- **Progressive Enhancement**: Advanced features like visual scanning degrade gracefully on older browsers.

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (optional — falls back to an in-memory store if absent)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root:
   ```env
   # Database (optional — in-memory fallback used if omitted)
   MONGO_URI="your_mongodb_connection_string"

   # Admin access
   ADMIN_SECRET="your_admin_secret"

   # EmailJS (OTP delivery)
   EMAILJS_PUBLIC_KEY="your_emailjs_public_key"

   # Groq API — required only for the "Accurate" AI match mode
   GROQ_API_KEY="your_groq_api_key"
   # Optional: how many inventory photos to send the model per request (default 8)
   MATCH_MAX_CANDIDATES=8
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Documentation & Attributions

Detailed asset licensing and library documentation can be found in
[SOURCES.md](./SOURCES.md). All application code, UI, and brand identity were
created by the development team for this competition; third-party libraries and
the Groq/Llama 4 Scout AI service used by the Accurate match mode are credited in
SOURCES.md.
