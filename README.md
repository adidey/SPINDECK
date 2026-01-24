# 🎚️ SpinDeck: Type-01 Module

SpinDeck is a minimalist, industrial-style focus companion inspired by mid-century audio equipment and the design principles of Dieter Rams. It combines high-precision tactile aesthetics with modern "Neural Sync" technology to create a distraction-free environment for deep work.

## 🧠 Core Features

- **Neural Playlist Sync**: Uses Gemini AI to "decode" public Spotify playlist URLs and generate a curated, dithered visual playback experience without complex OAuth logins.
- **Precision Control Interface**:
  - **WEIGHT**: Density/Volume control.
  - **WIDTH**: Temporal seeking and timeline navigation.
  - **SLANT**: Program selection (Deep Focus, Light Focus, Break Mode).
- **Industrial Display**: 8-bit dithered monochrome display with CRT scanlines and pixelated album art.
- **Session Logging**: Internal "Data Log" to track focus sessions and track history.

## 🛠️ Technical Specification

- **Framework**: React 19 (ES6+ Modules)
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini 3 Flash (via `@google/genai`)
- **Typography**: Inter (UI), JetBrains Mono (Technical), VT323 (Display)
- **Deployment**: Optimized for Vercel/Netlify with Environment Variable support.

## 🚀 Deployment & Environment

To enable the **Neural Sync** feature, you must provide a Google Gemini API Key.

1.  **Get a Key**: Visit [Google AI Studio](https://aistudio.google.com/).
2.  **Environment Variable**:
    - **Name**: `API_KEY`
    - **Value**: Your unique API key string.

### Local Development
The app includes a "Factory Default" protocol. If no API Key is detected, the device will automatically boot from its internal local library (`MOCK_TRACKS`), allowing for full offline functionality.

## 🎨 Design Philosophy
The "Type-01" module is designed to be felt as much as seen. The knobs utilize pointer-capture gestures to simulate high-torque rotary resistance, and the copper "Physical Switch" on the side provides a tactile start/stop mechanism.

---
*Built for the digital minimalist.*