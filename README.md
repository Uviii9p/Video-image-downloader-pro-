# 🚀 StreamClone: Universal Media Downloader & Player

A high-performance web application designed to download and stream media from popular platforms like **Instagram** and **YouTube**, as well as direct video links. Built with a premium glassmorphic UI, high-speed download engine, and secure streaming proxy.

## ✨ Features
- **Instagram Downloader**: Full support for Instagram Videos, Reels, and even Single Photo/Carousel posts (via fallback scraping).
- **YouTube Integration**: Instant metadata/thumbnail preview and high-quality "Stream Online" mode.
- **Secure Stream Proxy**: Bypasses CORS and hotlink restrictions to play Instagram content directly in your browser.
- **Auto-Quality Engine**: Choose between various qualities (1080p, 720p, 480p) optimized by `yt-dlp`.
- **Premium UI**: Dark mode, glassmorphism, responsive modals, and high-end CSS animations.
- **Download History**: Locally stored history of your recent downloads for quick access.

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Media Engine**: `yt-dlp` (Python-based CLI)
- **Icons**: Lucide Icons

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/StreamClone.git
   cd StreamClone
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Install yt-dlp**
   Ensure you have [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and added to your system PATH.
   Alternatively, place the `yt-dlp.exe` in the root directory.

4. **Start the Server**
   ```bash
   npm start
   ```
   Open `http://localhost:4000` in your browser.

## 📁 Project Structure
- `index.html`: Main UI structure.
- `style.css`: Premium glassmorphic styling system.
- `script.js`: Frontend logic, media analysis, and modal management.
- `server.js`: Node.js backend with download/stream engine and info API.

## 📝 License
This project is open-source and free to use.

---
*Created with ❤️ for high-performance media downloading.*
