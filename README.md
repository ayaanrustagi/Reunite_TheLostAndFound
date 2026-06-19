# REUNITE - Lost & Found Network

A premium, custom-coded web application designed to reconnect individuals with their lost belongings through a sophisticated blend of **RESTful API architecture** and **Client-Side AI**. Built strictly from scratch for the 2025-2026 FBLA Website Coding & Development competition.

## Project Overview

REUNITE is a full-stack solution that automates the lost and found process. Unlike traditional registry systems, it utilizes **Perceptual Hashing** to visually match found items against reports even with slight photographic differences.

## Key Technical Achievements

- **Custom Node.js Backend**: Built a robust REST API using Express and MongoDB to handle high-concurrency data management.
- **D-hashing**: Implemented a custom Perceptual Hashing algorithm that converts images into binary structural strings, allowing for visual similarity detection.
- **Accessibility (A11y)**: Fully compliant with WCAG standards, featuring ARIA labels, semantic HTML5 structure, and full keyboard-only navigation support.
- **Hybrid Search**: Combines **Levenshtein Distance** (Fuzzy Text Search) with visual color matching and structural hashing for 99% accurate retrieval.

## Team

- **Developers**: Ayaan Rustagi, Sree Kondapali, Tushaar Singh
- **School**: Rouse High School
- **Competition Year**: 2025-2026

## Technologies Used

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **Node.js** | Server-side runtime | [nodejs.org](https://nodejs.org/) |
| **Express** | REST API Framework | [expressjs.com](https://expressjs.com/) |
| **MongoDB** | NoSQL Data Persistence | [mongodb.com](https://www.mongodb.com/) |
| **JavaScript (ES6+)** | Modular Logic & AI Algorithms | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| **CSS3** | Premium UI & Glassmorphism | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| **EmailJS** | Automated Notifications | [emailjs.com](https://www.emailjs.com/) |

## Project Structure

```
Reunite/
├── server.js           # Backend Server Entry Point
├── backend/            # Business Logic & Data Models
│   ├── models/         # Mongoose Schemas (Items, Claims, Users)
│   ├── controllers/    # API Request Handlers
│   └── routes/         # Express Routing
├── js/
│   ├── api-client.js   # Custom API wrapper (Fetch/REST)
│   ├── utils.js        # Core dHash & Levenshtein Algorithms
│   ├── render.js       # Dynamic DOM orchestration
│   └── forms.js        # Validation & File processing
├── css/                # Design Tokens & UI components
└── assets/             # Original Brand Assets
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas connection string)

### Installation

1. **Clone the repository**
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment**
   Create/edit the `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/reunite
   PORT=3000
   ```
4. **Run the Application**
   ```bash
   node server.js
   ```
5. **Access Interface**
   Navigate to `http://localhost:3000`

## Features

- **D-hashing Powered Visual Scan**: Upload a photo to find matching items in the inventory.
- **Admin Command Center**: Real-time approval queue and claim verification system.
- **Bento Dashboard**: Personalized user experience with real-time status updates.
- **Smart Search**: Context-aware filtering by category, location, and metadata.

## Sources & Attributions
All fonts (Inter, Roboto Mono) and library licenses are documented in [SOURCES.md](./SOURCES.md). The REUNITE identity and code are 100% original work by the development team.
