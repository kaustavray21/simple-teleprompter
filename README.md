<div align="center">
  <img src="public/screen.svg" width="120" alt="Teleprompter Logo" />
  <h1>Simple Teleprompter</h1>
  <p>A clean, web-based teleprompter application designed for content creators, public speakers, and video professionals.</p>
</div>

---

## 🌟 Overview

Whether you're recording a YouTube video, delivering a presentation over Zoom, or shooting a professional film with a beamsplitter glass setup, the **Simple Teleprompter** provides everything you need. 

It runs entirely in your browser, meaning there is **nothing to install** and your files never leave your device for processing unless you explicitly link a public Google Doc.

<details>
<summary><strong>See what it looks like</strong></summary>

*(Add your screenshot here)*

</details>

## 🚀 Use Cases

- **🎥 Vlogging & Content Creation:** Read your script fluidly while maintaining direct eye contact with the camera lens.
- **🪞 Beamsplitter Glass Rigs:** Built-in one-click mirroring allows you to flip the text horizontally so it appears correct when reflected in professional teleprompter glass.
- **🎤 Remote Presentations:** Keep your notes scrolling automatically while you present via Teams, Zoom, or Google Meet.

## ⚙️ Features & Controls

The interface has been meticulously designed to stay out of your way. When the prompter is running, all controls automatically hide to provide a clean, distraction-free reading experience. 

To reveal the settings, simply tap the screen, move your mouse, or click anywhere.

### 🎛️ Top Configurations
- **📄 Load File:** Click the Upload icon to import a local script in `.docx` (Word) or `.pdf` format. 
- **📋 Paste Text:** Directly paste text from your clipboard using the Paste icon.
- **🔗 G-Doc Import:** Link directly to a public Google Doc. Perfect for collaborative script writing with your team! *(Note: The document must be set to "Anyone with the link can view").*
- **⏩ Speed Control:** Fine-tune your scrolling speed with increments as precise as `0.1x`. Ranges from ultra-slow (`0.5x`) to extremely fast (`12.0x`).
- **🔠 Font Size:** Adjust the text scale from `24px` to `140px` to match your reading distance.
- **🔄 Mirror Toggle:** Reverses the text horizontally for use with physical teleprompter mirrors.

### 🕹️ Bottom Playback Controls
- **⏮️ Restart:** Instantly jumps back to the absolute top of your script.
- **⏪ Rewind:** Jumps backwards by a few lines. Great if you stumble or need a quick retake.
- **▶️ Play / ⏸️ Pause:** Toggles the auto-scroller. Clicking "Play" auto-hides the interface.
- **⏩ Fast Forward:** Skips forward ahead in the script.
- **🪟 Fullscreen:** Expands the app to fill your entire display. On mobile devices, this will also heavily attempt to lock the screen to landscape orientation for maximum horizontal reading space.

## 🛠️ Getting Started Locally

Want to host it yourself or tweak the code? The app is built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kaustavray21/simple-teleprompter.git
   ```

2. **Navigate into the directory:**
   ```bash
   cd simple-teleprompter
   ```

3. **Install the dependencies:**
   ```bash
   npm install
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

## 📝 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to use, modify, and distribute it as you see fit.
