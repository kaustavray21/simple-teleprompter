# Simple Teleprompter

A clean, web-based teleprompter application designed for content creators, public speakers, and video professionals. 

## Use Cases

- **Video Recording & Vlogging:** Read your script while looking directly into the camera lens.
- **Teleprompter Glass Compatibility:** Built-in mirroring means you can use it with professional physical teleprompter rigs (beamsplitter glass).
- **Format Flexibility:** Easily import your scripts from standard document formats like PDF and Word, or directly link to public Google Docs.

## Features & Controls

The application interface is divided into two main control areas that automatically hide while you are reading to provide a distraction-free experience. To reveal the controls at any time, simply move your mouse, tap the screen, or click anywhere.

### Top Settings Bar (Configuration)

- **Load File (`Upload` icon):** Click to upload a local script in `.docx` (Word) or `.pdf` format.
- **G-Doc (`Link` icon):** Imports text directly from a Google Doc. *Note: The Google Doc must be set to "Anyone with the link can view".*
- **Speed Slider:** Adjust the vertical scrolling speed of the text. Ranges from extremely slow (0.5x) to very fast (12x).
- **Size Slider:** Adjust the text font size to ensure readability from your camera distance (from 24px up to 140px).
- **Mirror Button:** Flips the text horizontally. This is specifically required when placing your screen under a teleprompter mirror setup.

### Bottom Playback Bar (Navigation)

- **Restart:** Instantly scrolls back to the very absolute top of your script.
- **Rewind:** Jumps backwards by a few lines, helpful if you stumble or need to repeat a sentence. 
- **Play / Pause:** Toggles the auto-scrolling on or off. When playing, UI controls will auto-hide.
- **Fast Forward:** Skips forward by a few lines to skip sections of your script.
- **Fullscreen:** Enters fullscreen desktop mode (and attempts to lock orientation to landscape on mobile devices) for maximum screen real estate.

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
