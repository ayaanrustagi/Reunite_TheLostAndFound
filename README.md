 REUNITE - The Intelligent Lost & Found Network

 FBLA Website Coding & Development (2025-2026)
**Developed by**: Ayaan Rustagi, Sree Kondapali, Tushaar Singh  
**School**: Rouse High School  
**Tech Stack**: Node.js, Express, MongoDB, Vanilla JavaScript, CSS3

 Executive Summary
REUNITE is a premium, full-stack digital ecosystem designed to solve the friction of lost and found management in high-density environments like schools and community centers. Unlike static registries, REUNITE leverages Perceptual D-hashing and Fuzzy Logic to create an automated, high-accuracy matchmaking engine between lost reports and found inventory.

 Design Philosophy: "Liquid Glass"
We moved away from generic templates to build a custom Liquid Glass Design System. 
- Glassmorphism: Layered transparency with `backdrop-filter: blur()` for depth.
- Bento Logic: Dashboards use a proportional "Bento Grid" for high information density without clutter.
- Micro-interactions: 60fps hardware-accelerated animations using CSS `transform` and `opacity` to ensure performance on low-end devices.

 Technical Architecture (MVC)
REUNITE follows the Model-View-Controller architecture to ensure scalability and security.

 1. The Intelligent Engine (`js/utils.js`)
- D-hashing (Difference Hashing): A custom-built visual algorithm that converts images into 64-bit structural strings to detect similarity regardless of resolution or minor lighting changes.
- Levenshtein Distance: Implements fuzzy text matching to account for typos in item titles (e.g., "Iphone" matching "iPhone").

 2. The Hardened Backend (`server.js` & `backend/`)
- Node.js/Express API: A secure REST API that handles all data reconciliation.
- Hybrid Data Persistence: MongoDB (Mongoose) for primary storage with an Automatic In-Memory Fallback (`mongodb-memory-server`) to ensure 100% uptime during local evaluations.
- Security Protocols: 
  - Server-side role verification for administrators.
  - Multi-Factor Authentication via Secure OTP (EmailJS).
  - Payload limiting (50MB) to prevent Denial-of-Service (DoS) attacks.

 3. The Audit Log System
Every administrative decision (Approve, Reject, Claim) is recorded in an immutable Audit Log, creating a professional-grade paper trail for accountability.

 Universal Design & Accessibility
REUNITE features a custom Accessibility Engine, allowing the interface to adapt to user needs without page refreshes:
- Reduced Motion: Disables non-essential animations for users with vestibular sensitivities.
- High Contrast Mode: Increases color contrast ratios to meet WCAG 2.1 AAA standards.
- Dynamic Text Scaling: Allows 80% to 150% font scaling across the entire UI.
- Aria-Compliance: Full keyboard navigation support with logical tab-flows and "Skip to Content" links.

 Responsive Performance
Built with a Mobile-First mentality:
- Breakpoint Logic: Custom media queries for Mobile (max 480px), Tablet (max 1024px), and Desktop (max 1400px).
- Progressive Enhancement: Advanced features like visual scanning gracefully degrade on older browsers.

 Getting Started

 Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB (Local or Cloud instance)

 Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize environment variables in `.env`:
   ```env
   MONGO_URI="our_code"
   ADMIN_SECRET="code"
   EMAILJS_PUBLIC_KEY="our_key"
   ```
4. Start the production server:
   ```bash
   npm start
   ```

 Documentation & Attributions
Detailed asset licensing and library documentation can be found in [SOURCES.md](./SOURCES.md). All code, logic, and brand identity were created 100% original for this competition.

  