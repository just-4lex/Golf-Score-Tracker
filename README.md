# Golf Score Tracker

A simple, installable app to track how many shots you take on each hole during a round of golf. Optimized for use on your Android phone (add to home screen and use offline on the course).

## Features

- **18 holes** — One card per hole with big **+** and **−** buttons so you can tap quickly between shots.
- **Running total** — Total strokes at the top.
- **Saves automatically** — Scores are stored on your device so you can close the app and come back.
- **New round** — Clear all scores and start a fresh round when you’re done.
- **Works offline** — Install it once; it works without internet on the course.
- **Installable** — Use “Add to Home screen” on Android to open it like an app from your launcher.

## Install on your Android phone

1. **Host the app** (you need HTTPS for “Add to Home screen”):
   - **Option A:** Push this repo to GitHub, then enable **GitHub Pages** (Settings → Pages → source: main branch). Your app will be at `https://<your-username>.github.io/Golf-Score-Tracker/`.
   - **Option B:** Deploy the folder to any static host (Netlify, Vercel, etc.) and note the URL.

2. **Open the app** on your Android phone in **Chrome** (same URL as above).

3. **Install the app:**
   - Tap the **⋮** menu → **“Add to Home screen”** (or **“Install app”**).
   - Confirm. An icon will appear on your home screen.

4. Open the app from the icon. Use it like any app; scores are saved on the device and it works offline.

## Run locally (for testing)

Serve the folder over HTTP (required for the service worker):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser. To test “Add to Home screen” on your phone, use a tunnel (e.g. ngrok) or deploy to GitHub Pages.

## Files

- `index.html` — Main page.
- `styles.css` — Layout and styling (large touch targets, readable in sunlight).
- `app.js` — Score state, localStorage, and UI updates.
- `manifest.json` — PWA manifest for install and theme.
- `sw.js` — Service worker for offline and caching.

No build step or account required; just host the files and open the URL on your phone.
