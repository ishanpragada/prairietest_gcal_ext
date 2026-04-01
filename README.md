# PrairieTest → Google Calendar

A Chrome extension that adds an **"Add to Calendar"** button to every exam reservation on [PrairieTest](https://us.prairietest.com). One click opens a pre-filled Google Calendar event — no login or OAuth required.

![Extension button shown next to a reservation's date and time](https://us.prairietest.com)

## Features

- Automatically detects all exam reservations on the PrairieTest homepage
- Extracts exam title, start time, duration, and location
- Opens a pre-filled Google Calendar event in a new tab
- Works with both upcoming and past reservations
- Handles dynamic page updates via `MutationObserver`

## Installation

> The extension is not published to the Chrome Web Store. Install it manually in developer mode.

1. Clone or download this repository
   ```
   git clone https://github.com/ishanpragada/prairietest_gcal_ext.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `prairietest_gcal_ext` folder
5. Navigate to [us.prairietest.com](https://us.prairietest.com) — an **Add to Calendar** button will appear next to each reservation's date

## Usage

1. Log in to PrairieTest and go to the homepage
2. Under **Exam reservations**, click the blue **Add to Calendar** button next to any reservation
3. A Google Calendar tab opens with the event pre-filled (title, time, location)
4. Click **Save** in Google Calendar

## How It Works

The content script (`content.js`) reads the `data-format-date` JSON attribute on each reservation's date element to get the UTC start time, parses the duration from the adjacent column, and builds a Google Calendar URL of the form:

```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=START/END&location=...
```

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Chrome extension manifest (v3), scoped to `*.prairietest.com` |
| `content.js` | Injected into PrairieTest pages; finds reservations and adds buttons |
| `styles.css` | Button styling |
| `icons/` | Extension icons (16×16, 48×48, 128×128) |
| `generate_icons.js` | Node script to regenerate icons (`node generate_icons.js`) |

## Development

To regenerate the icons after changes to `generate_icons.js`:

```bash
npm install canvas
node generate_icons.js
```

After editing any extension file, go to `chrome://extensions` and click the **refresh** icon on the extension card to reload it.
