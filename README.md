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

## Production local UDP control

A browser cannot send UDP and the public site cannot reach a robot's private IP, so route commands through a small gateway on the robot LAN:

`dashboard → https://www.sudoyantra.com/local/udp (Worker) → Cloudflare Tunnel → gateway:3000 → UDP robot:8888`

On the gateway (laptop/RPi on the same WiFi as the robot):

```bash
npm ci
npm run build
RELAY_TOKEN=<shared-secret> npm start
```

Copy `deploy/cloudflared-config.yml.example`, fill the tunnel UUID, and point it at `http://127.0.0.1:3000`. Deploy `deploy/worker.js` on the route `www.sudoyantra.com/local/udp` with secrets `RELAY_ORIGIN` (tunnel hostname) and `RELAY_TOKEN` (same shared secret).

In the dashboard, switch to **Local**, enter the robot IP, and leave **Relay** blank to use the same-site Worker. `?relay=https://<tunnel-host>` can be used to target a relay directly. Commands are unauthenticated on the LAN; keep the tunnel behind Cloudflare Access and rotate the shared token.

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
