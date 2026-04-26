🎬 CenInfo
A sleek, modern movie exploration platform built with React, Supabase, and the OMDb API. CenInfo allows users to discover trending movies, search for specific titles, view trailers, and manage a personal library of favorites.

Live Demo: ceninfo.up.railway.app

✨ Features
Infinite Discovery: Home feed features a curated list of popular titles with infinite scroll.

Deep Search: Search by title, director, or actor with specific filters for movies, series, and episodes.

User Authentication: Secure sign-in/sign-up powered by Supabase Auth.

Personal Library: Logged-in users can save movies to their "My Library" collection, synced across devices.

Rich Details: Full plot synopses, IMDb ratings, cast information, and runtime.

Trailers: Integrated YouTube trailers via the TMDB API.

Responsive UI: Minimalist, cinematic design with a sidebar navigation and professional dark-mode aesthetic.

🚀 Tech Stack
Frontend: React 19 (Vite)

Backend/Database: Supabase (Auth & PostgreSQL)

Styling: CSS3 (Custom Elite/Academic White themes)

APIs: OMDb API (Movie data) & TMDB API (Trailers)

Deployment: Railway

🛠️ Installation & Setup
Clone the repository:

Bash
git clone https://github.com/your-username/ceninfo.git
cd ceninfo
Install dependencies:

Bash
npm install
Environment Variables:
Create a .env file in the root and add your API keys:

Extrait de code
VITE_OMDB_API_KEY=your_omdb_key
VITE_TMDB_API_KEY=your_tmdb_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Run the development server:

Bash
npm run dev
📸 Project Structure
App.jsx: Main logic, routing, and state management.

Auth.jsx: Supabase authentication component.

supabase.js: Supabase client configuration.

App.css: Custom minimalist styling.