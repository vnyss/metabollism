# Metabolism — Mobile App

React Native (Expo) app. Same black & gold design, same features as the web version.

## Setup

```bash
cd app
npm install
npx expo start
```

Scan the QR code in **Expo Go** (iOS / Android).

## Before running

1. Find your computer's local IP address:
   - Windows: open CMD → `ipconfig` → look for IPv4 Address
   
2. Open `src/config.js` and set `API_BASE_URL`:
   ```js
   export const API_BASE_URL = 'http://192.168.X.X:5000';
   ```

3. Make sure the Flask server is running on your computer:
   ```bash
   cd ..
   python app.py
   ```
   Your phone and computer must be on the same Wi-Fi network.

## Screens

| Screen | Description |
|--------|-------------|
| Home | Landing page with features overview |
| Signup | Extended onboarding: name, age, sex, weight, height, username, password |
| Login | Username + password |
| Dashboard | Weather widget, daily log, M·Adapt card, progress charts, barcode scanner |
| AI Chat | Full chat with Gemini AI, running stick figure, food photo analysis, barcode scan |

## Features

- **Running stick figure** during AI response generation — sits when done
- **Animated weather icons** (sun, rain, snow, fog, thunder)
- **Barcode scanner** via device camera → Open Food Facts lookup
- **Food photo calorie counting** via Gemini vision (send image to Flask AI endpoint)
- **M·Adapt weekly plan** reads last 7 days and adjusts calorie targets
- **SVG charts** for weight trend and calorie bars
- **Session history** with long-press to delete
- **Shake + red error** on form validation
- All data stored locally via AsyncStorage (mirrors web localStorage)

## Dependencies note

- `react-native-svg` — weather icons + charts + runner figure
- `expo-camera` — barcode scanner
- `expo-image-picker` — food photo upload
- `expo-location` — weather geolocation
- `@expo-google-fonts/courier-prime` + `@expo-google-fonts/special-elite` — fonts
