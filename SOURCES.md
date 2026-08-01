# Sources, Attributions, and Licenses

All core application design, the "Liquid Glass" CSS design system, user interfaces, branding, database integration, and custom matching logic (including Difference Hashing and Levenshtein fuzzy text calculations) are the original work of the development team: **Ayaan Rustagi, Sree Kondapalli, and Tushaar Singh**. 

This document serves as a complete repository of all third-party libraries, utility CDNs, fonts, APIs, and frameworks integrated into the REUNITE system, in accordance with the FBLA Website Coding & Development guidelines.

---

## 1. Typography & Fonts

| Asset / Font | Version | Purpose / Justification | Date Accessed | License & Source |
| :--- | :--- | :--- | :--- | :--- |
| **Hanken Grotesk** | Variable | Used as the primary structural sans-serif body typeface to pair with Bricolage Grotesque. | June 23, 2026 | [SIL Open Font License](https://scripts.sil.org/OFL) / Google Fonts |
| **Bricolage Grotesque** | Variable | Used for large hero headings and expressive brand elements. | June 10, 2026 | [SIL Open Font License](https://scripts.sil.org/OFL) / Google Fonts |

---

## 2. Backend Frameworks & Libraries

| Library | Version | Purpose / Justification | Date Accessed | License & Source |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | v20.x (LTS) | Cross-platform JavaScript runtime environment for hosting the backend gateway. | June 12, 2026 | [Node.js License](https://github.com/nodejs/node/blob/main/LICENSE) |
| **Express.js** | ^5.2.1 | Minimalist web framework handling REST API routing and static files serving. | June 12, 2026 | [MIT License](https://github.com/expressjs/express/blob/master/LICENSE) |
| **Mongoose** | ^9.2.0 | Object Data Modeling (ODM) library for MongoDB schema definition and validation. | June 15, 2026 | [MIT License](https://github.com/Automattic/mongoose/blob/master/LICENSE.base) |
| **MongoDB Memory Server** | ^11.0.1 | Runs a local in-memory MongoDB instance to serve as an automatic evaluation fallback. | June 15, 2026 | [MIT License](https://github.com/nodkz/mongodb-memory-server/blob/master/LICENSE) |
| **bcryptjs** | ^3.0.3 | Secure password hashing algorithm (salted, 12 rounds) for registration and logins. | June 16, 2026 | [MIT License](https://github.com/dcodeIO/bcrypt.js/blob/master/LICENSE) |
| **helmet** | ^8.2.0 | Sets HTTP headers (CSP, HSTS, etc.) to defend the web server from common security exploits. | June 16, 2026 | [MIT License](https://github.com/helmetjs/helmet/blob/main/LICENSE) |
| **express-rate-limit** | ^8.5.2 | Rate-limiting middleware to protect the authentication endpoints from brute-force attempts. | June 16, 2026 | [MIT License](https://github.com/express-rate-limit/express-rate-limit/blob/main/LICENSE) |
| **multer** | ^2.0.2 | Handles `multipart/form-data` uploads for parsing found/lost item photos. | June 15, 2026 | [MIT License](https://github.com/expressjs/multer/blob/master/LICENSE) |
| **cors** | ^2.8.6 | Enables cross-origin resource sharing controls on API endpoints. | June 14, 2026 | [MIT License](https://github.com/expressjs/cors/blob/master/LICENSE) |
| **dotenv** | ^17.2.4 | Parses and binds environment configuration variables from the secure `.env` file. | June 12, 2026 | [BSD-2-Clause](https://github.com/motdotla/dotenv/blob/master/LICENSE) |
| **nedb-promises** | ^6.2.3 | Flat-file local database fallback option for offline or portable server deployment. | June 14, 2026 | [MIT License](https://github.com/bajankristof/nedb-promises/blob/master/LICENSE) |

---

## 3. Frontend Libraries & CDN Components

| Asset / Script | Version | Purpose / Justification | Date Accessed | License & Source |
| :--- | :--- | :--- | :--- | :--- |
| **Three.js** | r128 | WebGL 3D rendering library used to project the interactive key animation in the Hero. | June 18, 2026 | [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE) / CDNJS |
| **GSAP (GreenSock)** | v3.12.5 | Powering fluid page transitions and micro-interaction animations. | June 18, 2026 | [GreenSock standard License](https://gsap.com/community/standard-license/) / CDNJS |
| **Leaflet.js** | v1.9.4 | Interactive mapping library displaying campus coordinates for found/lost items. | June 19, 2026 | [BSD-2-Clause](https://github.com/Leaflet/Leaflet/blob/main/LICENSE) / Unpkg |
| **EmailJS SDK** | v3 | Direct client-side SMTP bridge for dispatching verification OTP codes. | June 19, 2026 | [EmailJS Terms of Service](https://www.emailjs.com/legal/terms-of-service/) |
| **Feather Icons** | v4.29.x | Open-source icon set referenced as the visual basis for our navigation and button icons. We hand-inlined our own SVG markup (no runtime library/CDN dependency) and credit Feather for the original designs. | June 15, 2026 | [MIT License](https://github.com/feathericons/feather/blob/main/LICENSE) |

---

## 4. Artificial Intelligence & Machine Learning APIs

| API / Model | Version | Purpose / Justification | Date Accessed | License & Source |
| :--- | :--- | :--- | :--- | :--- |
| **Groq Cloud API** | REST v1 | Endpoint for low-latency visual-description comparing in the Accurate matching mode. | June 20, 2026 | [Groq API Terms](https://groq.com/terms-of-use/) |
| **Llama 4 Scout** | `meta-llama/llama-4-scout-17b-16e-instruct` | Multimodal Large Language Model used to compare item details and confirm match likelihoods. | June 20, 2026 | [Llama 4 License Agreement](https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE) |

---

## 5. Visual Asset Generators

| Asset Generator | Description | Date Accessed | License / Link |
| :--- | :--- | :--- | :--- |
| **REUNITE Identity** | Logo branding, icons, and visual graphics generated by the team. | June 10, 2026 | Built by Development Team |
| **Grainy Gradients** | Grain and noise SVGs utilized in the background styling overlay. | June 10, 2026 | [grainy-gradients.vercel.app](https://grainy-gradients.vercel.app/) |