# Reunite - Lost & Found Network

A modern, responsive web application for managing lost and found items. Built for FBLA Website Coding & Development competition.

## Project Overview

Reunite is a comprehensive lost & found system designed to help communities reconnect people with their lost belongings. The platform features user authentication, item reporting, AI-powered visual matching, and an admin dashboard for item verification.

## Team

- **Developers**: Ayaan Rustagi, Sree Kondapali, Tushaar Singh
- **School**: Rouse High School
- **Event**: FBLA Website Coding & Development
- **Competition Year**: 2026

## Technologies Used

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| HTML5 | Structure & Semantics | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML) |
| CSS3 | Styling & Animations | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| JavaScript (ES6+) | Interactivity & Logic | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| Node.js & Express | Backend API | [expressjs.com](https://expressjs.com/) |
| MongoDB & Mongoose | Database | [mongodb.com](https://www.mongodb.com/) |
| EmailJS | Email Notifications | [emailjs.com](https://www.emailjs.com/docs/) |
| Google Fonts | Typography (Inter, Roboto Mono) | [fonts.google.com](https://fonts.google.com/) |

## Project Structure

```
Reunite_TheLostAndFound/
├── index.html          # Main HTML file (single-page application)
├── login.html          # Authentication page
├── server.js           # Backend Server Entry Point
├── backend/            
│   ├── models/         # MongoDB Models
│   ├── controllers/    # API Logic
│   └── routes/         # Express Routes
├── css/
│   ├── styles.css      # Primary stylesheet with responsive design
│   ├── auth.css        # Combined Auth & Login styles
│   └── animations.css  # Animation keyframes
├── js/
│   ├── app.js          # Main application wiring
│   ├── auth-flow.js    # Authentication flow logic
│   ├── config.js       # Configuration constants
│   ├── email.js        # Email service integration
│   ├── forms.js        # Form handling & validation
│   ├── render.js       # UI rendering logic
│   ├── state.js        # Global state management
│   ├── api-client.js   # API Client Wrapper (Replaces Supabase)
│   ├── ui.js           # UI interactions & navigation
│   └── utils.js        # Shared utility functions
├── assets/
│   └── reunite-logo.png    # Application logo
└── README.md           # This file
```

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running locally (default port 27017) or a MongoDB Atlas URI

### Installation & Setup

1. **Clone or download the repository**

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   The project includes a `.env` file. Ensure `MONGO_URI` points to your MongoDB instance.
   ```
   MONGO_URI=mongodb://localhost:27017/reunite
   PORT=3000
   ```

4. **Start the Server**
   ```bash
   node server.js
   ```
   The backend will start on http://localhost:3000.

5. **Open the Application**
   Open your browser and navigate to:
   http://localhost:3000

   (The server serves the static frontend files automatically).

## Features

### For Users
- **Report Items** - Submit detailed lost/found item reports with photos
- **Search & Filter** - Find items by keyword, category, location
- **AI Visual Matching** - Upload a photo to find matching items
- **Email Notifications** - Get updates when items are claimed or verified
- **Personal Dashboard** - Track your reports and claims

### For Administrators
- **Approve Items** - Review and approve submitted reports
- **Verify Claims** - Process ownership claims with evidence
- **Audit Log** - Track all system activities
- **User Management** - Manage user access levels

## Security Considerations

### Current Implementation
- Server-side API with MongoDB
- Session management via localStorage
- Admin access with role-based checks

### Production Recommendations
- Use HTTPS
- Implement JWT for stateful authentication
- Use Environment Variables for all secrets (already implemented)
- Enable MongoDB Auth

## License

This project was created for the FBLA Website Coding & Development competition. 
