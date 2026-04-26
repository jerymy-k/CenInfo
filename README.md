# 🎬 CenInfo — Cinematic Intelligence

CenInfo is a high-performance, minimalist movie discovery platform. It leverages a modern full-stack serverless architecture to provide real-time movie data, instant trailers, and cloud-synced user libraries.

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen?style=flat-square)](https://ceninfo.up.railway.app/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-black?style=flat-square&logo=supabase)](https://supabase.com/)
[![Railway](https://img.shields.io/badge/Platform-Railway-indigo?style=flat-square&logo=railway)](https://railway.app/)

---

## 🌟 Key Features

* **⚡ Real-Time Search:** Instant filtering across the OMDb database for movies, series, and episodes.
* **🍿 Infinite Scroll:** Discover popular titles effortlessly with an automated pagination system.
* **🔐 Secure Auth:** Full user management (Login/Signup/Session) via Supabase Auth.
* **📚 Personal Library:** Save your favorite titles to a private collection stored in PostgreSQL.
* **🎥 HD Trailers:** Automated trailer fetching using the TMDB API and YouTube integration.
* **📱 Responsive Design:** Professional dark-mode UI optimized for both desktop and mobile viewports.

---

## 🏗️ Project Architecture

```mermaid
graph LR
    A[React Frontend] --> B(OMDb API)
    A --> C(TMDB API)
    A --> D(Supabase Auth)
    A --> E(Supabase PostgreSQL)
    B --> A
    C --> A
🚀 Getting Started
1. Prerequisites
Node.js (v18+)

NPM or Yarn

API Keys for OMDb and TMDB

2. Installation
Bash
# Clone the repository
git clone [https://github.com/your-username/ceninfo.git](https://github.com/your-username/ceninfo.git)

# Install dependencies
npm install
3. Environment Variables
Create a .env file in the root directory and populate it with your credentials:

Extrait de code
VITE_OMDB_API_KEY=your_omdb_key
VITE_TMDB_API_KEY=your_tmdb_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Local Development
Bash
npm run dev
🚢 Deployment (Railway Guide)
This project is optimized for deployment on Railway using Nixpacks.

Port Configuration: Ensure your Railway service is listening on port 5173.

Start Command: Use npm run start.

Vite Config: To prevent "Blocked Host" errors, ensure your vite.config.js is updated:

JavaScript
// vite.config.js
export default defineConfig({
  preview: {
    allowedHosts: ['ceninfo.up.railway.app']
  }
})
📁 File Structure
Plaintext
ceninfo/
├── src/
│   ├── assets/          # Project images and logos
│   ├── Auth.jsx         # Supabase Auth components
│   ├── App.jsx          # Main application logic & state
│   ├── supabase.js      # Client configuration
│   └── App.css          # Elite/Minimalist styling
├── public/              # Static assets
├── .env                 # Local secrets (ignored by git)
├── package.json         # Dependency management
└── vite.config.js       # Build & Host configuration
👨‍💻 Author
Mohamed Elkerymy Web Developer & UI/UX Enthusiast

© 2026 CenInfo Project. Built for performance and design.