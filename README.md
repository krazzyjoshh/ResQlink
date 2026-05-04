# ResqLink

A React Native (Expo) emergency alert app inspired by the ResqLink design.

## Features

- **GPS Location** — displays current address with accuracy
- **Emergency Services Grid** — tap to select Hospital, Ambulance, Security, BFP, Red Cross, Barangay
- **Emergency Alert Button** — single tap to dispatch; hold 3 seconds to auto-select all services
- **Premium Upgrade Banner** — upsell card for premium plan
- **Live Response Panel** — shows active alert status with radar animation
- **Network Status Panel** — shows connected response grid stats

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo Go](https://expo.dev/go) app on your phone, **or** Android/iOS emulator

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS) to run on your device.

## Project Structure

```
ResqLink/
├── App.tsx          # Main screen (all UI + logic)
├── app.json         # Expo config
├── package.json
└── tsconfig.json
```

## Customisation

| Thing to change | Where |
|---|---|
| User name ("Gwyneth") | `App.tsx` → `greeting` |
| GPS location (currently static) | Integrate `expo-location` in `App.tsx` |
| Service list | `SERVICES` array in `App.tsx` |
| Colors | `C` object (theme) in `App.tsx` |
