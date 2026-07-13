# Simple Robot Dashboard

A React-based dashboard for monitoring and controlling IoT robots and Wi-Fi devices.

## Tech Stack

- **React 18** with functional components and hooks
- **Vite** for fast builds and development
- **GitHub Pages** for hosting (auto-deploy via GitHub Actions)

## Run locally

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173** with API proxy to `server2.sudoyantra.com`.

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

Push to `main` branch — GitHub Actions will auto-build and deploy.

Or deploy manually:

```bash
npm run deploy
```

## Project Structure

```
src/
├── main.jsx       # Entry point
├── App.jsx        # All components and state
├── App.css        # Styles
└── api.js         # API helpers and log parsing
```

## Features

- Robot and Wi-Fi device list with online/offline status
- Real-time log viewing with GMT/IST time tags
- Robot movement controls (WASD keyboard + buttons)
- Wi-Fi camera controls
- Stats dashboard (total runs, battery, version)
- Auto-refresh every 10 seconds
- Multiple backend support (Server 2, HPCL, Carbantis)
- Responsive design

## Old version

The original vanilla JS version is preserved in `index.html` and `server.js`. To run it:

```bash
node server.js
```
