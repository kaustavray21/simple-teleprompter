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

## 🎤 Voice Controls (New!)
Control the prompter completely hands-free using the browser's native Web Speech API. Click the **Voice (Mic)** toggle to begin listening.

* **Playback**: `"play"`, `"resume"`, `"start"`, `"pause"`, `"stop"`
* **Speed**: `"faster"`, `"slower"`, `"speed 5"`, `"set speed to 3.5"`
* **Navigation**: `"restart"`, `"jump to line 30"`, `"jump to 50 percent"`, `"jump to end"`
* **Appearance**: `"bigger"`, `"smaller"`, `"size 80"`, `"align left"`, `"font monospace"`, `"mirror"`
* **Disable**: `"mute"`, `"voice off"`

## ⚙️ Interface & Settings

The interface has been meticulously designed to stay out of your way. When the prompter is running, all controls automatically hide to provide a clean, distraction-free reading experience. 

### 🎛️ Top Configurations
- **📄 Load File:** Import scripts as `.pdf`, `.docx` (Word), or `.txt` plain text files.
- **🔗 G-Doc Import:** Link directly to a public Google Doc. Perfect for collaborative script writing with your team! *(Note: The document must be set to "Anyone with the link can view").*
- **📋 Paste Text:** Directly paste your script text into the built-in modal.
- **💾 Auto-Save Memory:** The active script is automatically saved to your browser's local storage. You can safely refresh the page without losing your text! Active scripts auto-expire after 24 hours.
- **📚 Script Library:** Save multiple scripts for future use! Store them permanently or as 24-hour Temporary Sessions. Browse, load, or delete them via the "Library" menu.
- **📶 Offline Mode:** Built as a Progressive Web App (PWA). You can install the teleprompter directly to your device and use it offline! There is also a built-in guide for offline Voice Dictation setup.
- **⏩ Speed Control:** Fine-tune your scrolling speed with increments as precise as `0.1x`.
- **🔠 Font Size & Style:** Adjust the text scale from `24px` to `200px`. Choose between Sans-Serif, Serif, Monospace, Arial, and Georgia fonts.
- **📏 Alignment:** Align paragraphs Left, Right, Center, or Justify.
- **🔄 Mirror Toggle:** Reverses the text horizontally for use with physical teleprompter mirrors.
- **🎙️ Voice Toggle:** Enables hands-free Speech Recognition commands.
- **🗑️ Clear (Dustbin Icon):** Manually flushes your current script from memory and resets the prompter.

### 🕹️ Bottom Playback Controls
- **⏮️ Restart:** Instantly jumps back to the absolute top of your script.
- **⏪ Rewind:** Jumps backwards by a few lines. Great if you stumble or need a quick retake.
- **▶️ Play / ⏸️ Pause:** Toggles the auto-scroller. Clicking "Play" auto-hides the interface.
- **⏩ Fast Forward:** Skips forward ahead in the script.
- **🪟 Fullscreen:** Expands the app to fill your entire display. Locks the screen to landscape orientation on mobile devices.

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
