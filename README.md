# SPINPOD

This is a personal project I built because I'm tired of music players that look like spreadsheets. I wanted something that felt like heavy hardware—the kind of industrial equipment you'd find in a lab or a high-end 1970s studio—but applied to a focus timer.

## Why this exists
I find modern UI too "polite" and flat. I wanted high-contrast blacks, CRT flickering, and knobs that actually feel like they have torque. It's a focus tool, first and foremost. It doesn't help you discover music; it helps you stay in the zone with what you already have.

## Design Philosophy
The aesthetic is heavily inspired by Dieter Rams and industrial hardware (think Braun or Tascam).
- **Physicality over convenience**: The side switch and rotary knobs are intentional. Hovering isn't enough; you have to "interact" with it.
- **The CRT look**: I spent a lot of time on the dithered album art and scanlines. It's supposed to look slightly "off" and analog, not crisp and retina-ready.
- **Monochrome-ish**: Color is used only where it matters—for status indicators (Red/Green LEDs). Everything else is about shadows and textures.

## The Spotify Problem (Trade-offs)
Spotify's API is a nightmare for a "minimalist" tool because it forces you through complex OAuth flows just to see what's playing. 
- **The Hack**: I'm using Gemini AI to "decode" public playlist URLs. It's a bit of a workaround, but it lets the UI stay clean without a million "Login with Spotify" popups.
- **The Limitation**: Since I'm not doing full OAuth by default, control is one-way. This is a *display* and *controller* first. If you want a full Spotify client with search and discovery, use the actual Spotify app.

## Intentionally Out of Scope
I'm not going to build these:
- **Search bar**: You should know what playlist you're listening to before you sit down to work.
- **Social features**: No "see what friends are listening to." This is for deep work, not hanging out.
- **Mobile optimization**: This was designed specifically for a desktop or a dedicated tablet "console" on your desk. Using it on a phone feels cramped and ruins the scale.

## Setup
If you want to run this yourself, you'll need a Google AI Studio (Gemini) API key.
1. Create a `.env` file.
2. Add `VITE_GEMINI_API_KEY=your_key_here`.
3. `npm install` and `npm run dev`.

---
*Built for me, shared with you. - DEYSIGNS*
