import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Advanced Watchlists
  const [watchlists, setWatchlists] = useState({
    planToWatch: [],
    watching: [],
    completed: []
  });

  useEffect(() => {
    // Load local history
    try {
      const savedHist = localStorage.getItem("ceninfo_history");
      if (savedHist) setHistory(JSON.parse(savedHist));
      
      const savedWatchlists = localStorage.getItem("ceninfo_watchlists");
      if (savedWatchlists) setWatchlists(JSON.parse(savedWatchlists));
    } catch { }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadFavorites(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFavorites(session.user.id);
        setShowAuth(false);
      } else {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadFavorites(userId) {
    const { data } = await supabase.from("favorites").select("*").eq("user_id", userId);
    if (data) {
      const mapped = data.map(f => ({
        imdbID: f.imdb_id,
        Title: f.title,
        Year: f.year,
        Poster: f.poster,
        Genre: f.genre,
        Director: f.director,
        Actors: f.actors,
        Plot: f.plot,
        imdbRating: f.imdb_rating,
        Runtime: f.runtime,
        Type: f.type,
      }));
      setFavorites(mapped);
    }
  }

  async function toggleFavorite(movie) {
    if (!user) { setShowAuth(true); return; }
    if (isFavorite(movie.imdbID)) {
      await supabase.from("favorites").delete().eq("imdb_id", movie.imdbID).eq("user_id", user.id);
      setFavorites(prev => prev.filter(f => f.imdbID !== movie.imdbID));
    } else {
      const row = {
        imdb_id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster,
        genre: movie.Genre || null,
        director: movie.Director || null,
        actors: movie.Actors || null,
        plot: movie.Plot || null,
        imdb_rating: movie.imdbRating || null,
        runtime: movie.Runtime || null,
        type: movie.Type || null,
        user_id: user.id,
      };
      await supabase.from("favorites").insert(row);
      setFavorites(prev => [...prev, movie]);
    }
  }

  function isFavorite(imdbID) {
    return favorites.some(f => f.imdbID === imdbID);
  }

  function addToHistory(movie) {
    setHistory(prev => {
      const filtered = prev.filter(m => m.imdbID !== movie.imdbID);
      const newHistory = [movie, ...filtered].slice(0, 50);
      localStorage.setItem("ceninfo_history", JSON.stringify(newHistory));
      return newHistory;
    });
  }

  function updateWatchlist(movie, status) {
    setWatchlists(prev => {
      const newLists = { ...prev };
      // Remove from all custom lists
      Object.keys(newLists).forEach(key => {
        newLists[key] = newLists[key].filter(m => m.imdbID !== movie.imdbID);
      });
      // Add to selected list
      if (status && status !== "none" && status !== "favorite") {
        if (!newLists[status]) newLists[status] = [];
        newLists[status].push(movie);
      }
      localStorage.setItem("ceninfo_watchlists", JSON.stringify(newLists));
      return newLists;
    });
    
    // Also toggle favorite if status is favorite
    if (status === "favorite" && !isFavorite(movie.imdbID)) {
      toggleFavorite(movie);
    } else if (status !== "favorite" && isFavorite(movie.imdbID)) {
      toggleFavorite(movie);
    }
  }

  function getWatchlistStatus(imdbID) {
    if (isFavorite(imdbID)) return "favorite";
    for (const status in watchlists) {
      if (watchlists[status].some(m => m.imdbID === imdbID)) return status;
    }
    return "none";
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      favorites, 
      showAuth, 
      setShowAuth, 
      toggleFavorite, 
      isFavorite,
      signOut,
      history,
      addToHistory,
      watchlists,
      updateWatchlist,
      getWatchlistStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
