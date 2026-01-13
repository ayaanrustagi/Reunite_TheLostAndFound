# Reunite - Lost & Found Network

A modern, responsive web application for managing lost and found items. Built for FBLA Website Coding & Development competition.

## Project Overview

Reunite is a comprehensive lost & found system designed to help communities reconnect people with their lost belongings. The platform features user authentication, item reporting, AI-powered visual matching, and an admin dashboard for item verification.

##Team

- **Developers**: Ayaan Rustagi, Sree Kondapali, Tushaar Singh
- **School**: Rouse High School
- **Event**: FBLA Website Coding & Development
- **Competition Year**: 2026

## 🛠️ Technologies Used

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| HTML5 | Structure & Semantics | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML) |
| CSS3 | Styling & Animations | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| JavaScript (ES6+) | Interactivity & Logic | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| Supabase | Backend Database & Auth | [supabase.com](https://supabase.com/docs) |
| EmailJS | Email Notifications | [emailjs.com](https://www.emailjs.com/docs/) |
| Google Fonts | Typography (Inter, Roboto Mono) | [fonts.google.com](https://fonts.google.com/) |

## Project Structure

```
Reunite_TheLostAndFound/
├── index.html          # Main HTML file (single-page application)
├── styles.css          # Primary stylesheet with responsive design
├── auth.css            # Authentication modal styles
├── animations.css      # Animation keyframes (if separate)
├── script.js           # Main JavaScript application logic
├── assets/
│   └── Reunite-logo.png    # Application logo
└── README.md           # This file
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for external services)

### Local Development
1. Clone or download the repository
2. Open `index.html` in a web browser
3. For live server development, use VS Code Live Server extension or:
   ```bash
   npx http-server . -p 5500
   ```

### Configuration (Optional)
The application uses Supabase for backend services. To configure your own instance:

1. Create a project at [supabase.com](https://supabase.com)
2. Create the following tables:
   - `items` - Lost/found item records
   - `claims` - Item claim submissions
3. Update the configuration in `script.js`:
   ```JavaScript
   window.SUPABASE_URL = "your-project-url";
   window.SUPABASE_ANON_KEY = "your-anon-key";
   ```

## Features

### For Users
-**Report Items** - Submit detailed lost/found item reports with photos
-**Search & Filter** - Find items by keyword, category, location
- **AI Visual Matching** - Upload a photo to find matching items
- **Email Notifications** - Get updates when items are claimed or verified
- **Personal Dashboard** - Track your reports and claims

### For Administrators
- **Approve Items** - Review and approve submitted reports
- **Verify Claims** - Process ownership claims with evidence
- **Audit Log** - Track all system activities
- **User Management** - Manage user access levels

## Accessibility Features

- Skip navigation link for keyboard users
- ARIA labels on interactive elements
- Screen reader compatible structure
- High contrast color scheme
- Keyboard navigable forms and menus
- Focus indicators on all interactive elements

## 📱 Responsive Design

The application is fully responsive across:
- Desktop (1200px+)
- Laptop (1024px)
- Tablet (768px)
- Mobile (480px and below)

## Security Considerations

### Current Implementation
- Client-side form validation
- Session management via localStorage
- Admin access requires a separate access code

### Production Recommendations
For production deployment, consider:
- Moving sensitive credentials to environment variables
- Implementing server-side validation
- Using Supabase Row Level Security (RLS)
- Adding rate limiting on form submissions
- Implementing CAPTCHA for public forms

## 📚 Credits & Attributions

### External Libraries
- **Supabase JS Client** v2.39.7 - [MIT License](https://github.com/supabase/supabase-js/blob/master/LICENSE)
- **EmailJS Browser** v3 - [MIT License](https://github.com/nicebuzzer/emailjs-sdk/blob/master/LICENSE)

### Fonts
- **Inter** by Rasmus Andersson - [Open Font License](https://fonts.google.com/specimen/Inter)
- **Roboto Mono** by Christian Robertson - [Apache License 2.0](https://fonts.google.com/specimen/Roboto+Mono)

### Design Resources
- Grainy gradient texture from [grainy-gradients.vercel.app](https://grainy-gradients.vercel.app/)
- Custom logo designed for the Reunite project

## 📄 License

This project was created for the FBLA Website Coding & Development competition. 


