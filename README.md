# 🎬 CenInfo

CenInfo is a modern movie discovery web application that allows users to search for movies and TV shows, explore trending content, watch trailers, and manage their personal favorites.

🔗 Live Demo: https://ceninfo.up.railway.app/

---

## ✨ Features

- 🔍 Search Movies & Series using OMDb API  
- 🎞️ Watch Trailers powered by TMDB  
- ❤️ Add to Favorites (with authentication)  
- 🔐 User Authentication via Supabase  
- 📚 Personal Library for saved movies  
- 🎯 Category Filters (Movies, Series, Episodes)  
- ♾️ Infinite Scrolling for discovery  
- 📄 Detailed Movie Info (plot, actors, rating, etc.)

---

## 🛠️ Tech Stack

- Frontend: React (Vite)
- Backend / Auth / DB: Supabase
- APIs:
  - OMDb API (movie data)
  - TMDB API (trailers)
- Deployment: Railway

---

## 📁 Project Structure

src/
│── assets/          
│── components/      
│── App.jsx    
│── Auth.jsx
│── Auth.css
│── main.jsx
│── supabase.js      
│── App.css          

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add:

VITE_OMDB_API_KEY=your_omdb_api_key  
VITE_TMDB_API_KEY=your_tmdb_api_key  
VITE_SUPABASE_URL=your_supabase_url  
VITE_SUPABASE_ANON_KEY=your_supabase_key  

---

## 🚀 Installation & Setup

1. Clone the repository:

git clone [https://github.com/your-username/ceninfo.git  ](https://github.com/jerymy-k/CenInfo)
cd ceninfo  

2. Install dependencies:

npm install  

3. Run the app:

npm run dev  

---

## 🔐 Authentication

- Users can sign in / sign up using Supabase Auth  
- Favorites are stored per user in the database  
- Unauthorized users are prompted to log in when adding favorites  

---

## ❤️ Favorites System

- Add/remove movies from your personal library  
- Stored in Supabase database  
- Synced per user session  

---

## 🎥 Trailer Integration

- Uses TMDB API to fetch movie trailers  
- Displays embedded YouTube player inside movie details  

---

## 📌 Future Improvements

- ⭐ Ratings & reviews system  
- 🎯 Personalized recommendations  
- 📱 Mobile optimization improvements  
- 🔎 Advanced filters (genre, year, rating)  
- 🌙 Dark/Light theme toggle  

---

## 👤 Author

Developed by ELKERYMY Mohamed

---

## 📄 License

This project is open-source and available under the MIT License.
