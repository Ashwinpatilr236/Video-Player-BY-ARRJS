# Video Player by ARRJS

A professional, high-performance web and native Android TV application for seamlessly streaming VOD (Video on Demand), Live TV, and custom playlists. Built with a modern glassmorphism aesthetic and optimized for 10-foot TV experiences.

## Overview

Video Player by ARRJS bridges the gap between premium smart TV layouts (like WebOS/Tizen) and modern Android TV flexibility. It features an interactive EPG (Electronic Program Guide), lightning-fast channel switching, floating Picture-in-Picture (PiP), and universal search capabilities.

## Features

- **Live TV EPG Grid**: Fully functional, dynamic program guide with timeline scrolling.
- **VOD & Series Hub**: Browse movies and TV series effortlessly.
- **Glassmorphism UI**: Beautiful, lightweight frosted glass effects with neon accent highlights.
- **Android TV Remote Optimized**: D-pad ready. Fully navigable without a touchscreen.
- **Picture-in-Picture (PiP)**: Pop out video playback into a floating window.
- **Universal Search**: Type to instantly filter and find channels.

## Supported Platforms

- **Android Mobile & Tablet**
- **Android TV** (Native D-Pad navigation support)
- **Web Browser**

## Installation

### Web/Development
1. `cd web`
2. `npm install`
3. `npm run dev` (or `npm run build` for production)

### Android / Android TV
1. Open the project in Android Studio.
2. Ensure you have the Android SDK for your target device.
3. Build the APK via `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. Sideload the generated `.apk` to your Android TV or install on your phone.

## How to Use (Android TV)

- **D-Pad Up/Down**: Navigate between channels in the EPG or jump through categories.
- **D-Pad Left/Right**: Open the side drawer menu or explore upcoming time slots in the EPG.
- **OK / Center Button**: Select a channel to play.
- **Back Button**: Exit full-screen playback or close the application gracefully.
- **Search (S or /)**: Open the Universal Search overlay.

## Permissions

The Android application only requests the minimum required permissions:
- `INTERNET`: Required to stream video content and fetch remote playlists.
- `ACCESS_NETWORK_STATE`: Required to monitor connection drops and handle buffering.
- `REQUEST_INSTALL_PACKAGES`: Required **only** for the built-in OTA update mechanism (updating the app without leaving it).

## Security & Privacy

- **No Analytics Tracking**: This app does not ship with built-in telemetry or usage tracking.
- **Local History Storage**: Recent watch history is stored entirely locally on your device via `SharedPreferences` / `localStorage`.
- **API Security**: No hardcoded third-party or AI API keys are bundled with this source code.

## Development Setup

- **Language**: Kotlin (Android) / React.js + Tailwind CSS (Web)
- **Minimum Android SDK**: (See `app/build.gradle.kts`)

## Security Policy

**Never** commit your `.env` files or signing keystores to version control.
When contributing to this repository, ensure you use the `.env.example` as a template rather than committing hardcoded credentials.

## License

Licensing information is currently not specified. Contact ARRJS for distribution rights.
