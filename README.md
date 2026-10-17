# Video Player by ARRJS

A professional, high-performance web-based IPTV, Live TV, VOD, Xtream Codes, and Stalker Portal Smart Player. Built with a modern glassmorphism aesthetic and optimized for both desktop browsers and 10-foot Smart TV experiences.

## Overview

**Video Player by ARRJS** bridges the gap between premium smart TV layouts (like WebOS/Tizen) and modern web accessibility. Powered by React 19, TypeScript, Tailwind CSS, and Hls.js, it features:
- Interactive **EPG (Electronic Program Guide)** with time-grid browsing
- **Xtream Codes API** integration (Server URL, username, password authentication)
- **Stalker Portal / MAG Box** integration with MAC address handshake
- Multi-playlist M3U / M3U8 support & local file uploading
- **Spatial Navigation (D-Pad)** for TV remote controls and keyboards
- Real-time channel search, favorites, category filters, and DTH-style numeric channel zapping
- Adaptive bitrate switching, audio track selection, and picture-in-picture (PiP)

---

## Features

- **Xtream Codes & Stalker Portal**: Stream directly from standard IPTV providers with full category and channel parsing.
- **Dynamic Live TV EPG Grid**: Fully functional XMLTV program guide with timeline scrolling.
- **Glassmorphism UI**: Beautiful, lightweight frosted glass effects with neon accent highlights.
- **Smart TV Remote Optimized**: D-pad ready via `useSpatialNavigation`. Fully navigable on any browser-enabled Smart TV (Android TV, Fire TV, LG webOS, Samsung Tizen).
- **Picture-in-Picture & Aspect Ratios**: Pop out video playback into a floating window or toggle between contain, cover, and fill.
- **Universal Search**: Type or use voice/remote to instantly filter channels.
- **Zero Privacy Leakage**: All playlists, credentials, and watch history are stored strictly locally in your browser's `localStorage`.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Running the Web Application
```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
cd web
npm run build
```
The compiled, optimized production files will be output to `web/dist`.

---

## Keyboard & Smart TV Remote Controls

| Key | Action |
| :--- | :--- |
| **Arrow Up / Down** | Navigate channels / quick channel surf |
| **Arrow Left / Right** | Open Category Drawer / scrub guide timeline |
| **Enter / OK** | Play selected channel |
| **Escape / Back** | Close overlays, exit full-screen, or back protection |
| **M** | Toggle Mute / Unmute |
| **F** | Toggle Fullscreen |
| **S or /** | Open Universal Search |
| **G** | Toggle EPG Electronic Program Guide |
| **0-9** | DTH Numeric Channel Zapping |

---

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Glassmorphism Theme
- **Streaming Core**: Hls.js (Low-latency adaptive bitrate streaming)
- **Icons**: Lucide React
- **Build Tool**: Vite

---

## License

Proprietary — Developed with excellence by **ARRJS Technologies**.
