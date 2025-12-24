# Reunite — FBLA Website Coding & Development (School Lost-and-Found)

## What this is
A fully functional school lost-and-found website for students and staff:
- Report found items (with optional photo)
- Browse/search approved items
- Submit claim/inquiry requests
- Admin review dashboard to approve/reject reports and process claims

## How to run (local)
Use a local server (recommended):
- Python:
  ```bash
  python -m http.server 8000
  ```
  Open: `http://localhost:8000`

Or use the Live Server extension in Cursor.

## Login flow (FBLA reliable)
Click **SIGN IN** and choose:
- **Student**: email required
- **Admin**: email + Admin Access Code required

Default admin code (change in script.js):
- `FBLA2025`

## Admin features
- Approve/Reject pending item reports
- Approve/Reject claims
- Mark items as claimed

## AI-assisted matching (offline)
This project uses **perceptual hashing (dHash)** to suggest visually similar items:
- When a photo is uploaded, a 64-bit perceptual hash is computed in-browser.
- Approved items with stored hashes are compared via Hamming distance.
- The top 3 closest matches are shown with a similarity percentage.

This is offline, stable, and competition-ready.

## Data storage
For state reliability, the site runs in offline demo mode:
- items + claims stored in `localStorage`
- no internet required

## Files
- `index.html`
- `styles.css`
- `script.js`
- `README.md`
- `SOURCES.md` (citations/attribution)

## Sources & attributions
See `SOURCES.md`.
