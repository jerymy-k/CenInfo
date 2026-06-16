import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [history, setHistory] = useState([]);
  const [showRazaneWelcome, setShowRazaneWelcome] = useState(false);
  
  // Advanced Watchlists
  const [watchlists, setWatchlists] = useState({
    planToWatch: [],
    watching: [],
    completed: []
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
        setShowAuth(false);
        if (event === 'SIGNED_IN' && session.user.email === 'wakhidirazane@gmail.com') {
          setShowRazaneWelcome(true);
        }
      } else {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId) {
    // Load favorites
    const { data: favs } = await supabase.from("favorites").select("*").eq("user_id", userId);
    if (favs) {
      setFavorites(favs.map(f => ({
        imdbID: f.imdb_id, Title: f.title, Year: f.year, Poster: f.poster,
        Genre: f.genre, Director: f.director, Actors: f.actors, Plot: f.plot,
        imdbRating: f.imdb_rating, Runtime: f.runtime, Type: f.type,
      })));
    }

    // Load history
    const { data: hist } = await supabase.from("history").select("*").eq("user_id", userId).order('viewed_at', { ascending: false });
    if (hist) {
      setHistory(hist.map(h => h.movie_data));
    }

    // Load watchlists
    const { data: lists } = await supabase.from("watchlists").select("*").eq("user_id", userId);
    if (lists) {
      const newWatchlists = { planToWatch: [], watching: [], completed: [] };
      lists.forEach(row => {
        if (newWatchlists[row.list_type]) {
          newWatchlists[row.list_type].push(row.movie_data);
        }
      });
      setWatchlists(newWatchlists);
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

  async function addToHistory(movie) {
    if (!user) return; // Silent return for history tracking
    
    setHistory(prev => {
      const filtered = prev.filter(m => m.imdbID !== movie.imdbID);
      return [movie, ...filtered].slice(0, 50);
    });

    if (user) {
      await supabase.from("history").upsert({
        user_id: user.id,
        imdb_id: movie.imdbID,
        movie_data: movie,
        viewed_at: new Date().toISOString()
      }, { onConflict: 'user_id, imdb_id' });
    }
  }

  async function updateWatchlist(movie, status) {
    if (!user) { setShowAuth(true); return; }

    setWatchlists(prev => {
      const newLists = { ...prev };
      Object.keys(newLists).forEach(key => {
        newLists[key] = newLists[key].filter(m => m.imdbID !== movie.imdbID);
      });
      if (status && status !== "none" && status !== "favorite") {
        if (!newLists[status]) newLists[status] = [];
        newLists[status].push(movie);
      }
      return newLists;
    });
    
    if (status === "favorite" && !isFavorite(movie.imdbID)) {
      toggleFavorite(movie);
    } else if (status !== "favorite" && isFavorite(movie.imdbID)) {
      toggleFavorite(movie);
    }

    if (user) {
      await supabase.from("watchlists").delete().eq("user_id", user.id).eq("imdb_id", movie.imdbID);
      if (status && status !== "none" && status !== "favorite") {
        await supabase.from("watchlists").insert({
          user_id: user.id,
          imdb_id: movie.imdbID,
          list_type: status,
          movie_data: movie
        });
      }
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
      getWatchlistStatus,
      showRazaneWelcome,
      setShowRazaneWelcome
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
