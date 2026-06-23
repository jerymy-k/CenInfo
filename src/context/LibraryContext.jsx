/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "./AuthContext";

const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const { user, setShowAuth } = useAuth();
  
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [watchlists, setWatchlists] = useState({
    planToWatch: [],
    watching: [],
    completed: []
  });
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    } else {
      setFavorites([]);
      setHistory([]);
      setWatchlists({ planToWatch: [], watching: [], completed: [] });
      setDownloads([]);
    }
  }, [user]);

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
        if (!newWatchlists[row.list_type]) {
          newWatchlists[row.list_type] = [];
        }
        newWatchlists[row.list_type].push(row.movie_data);
      });
      setWatchlists(newWatchlists);
    }

    // Load mock downloads from local storage
    const savedDownloads = localStorage.getItem(`ceninfo_downloads_${userId}`);
    if (savedDownloads) {
      setDownloads(JSON.parse(savedDownloads));
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
    if (!user) return; 
    
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

  function createList(listName) {
    if (!listName.trim()) return;
    setWatchlists(prev => {
      if (prev[listName]) return prev;
      return { ...prev, [listName]: [] };
    });
  }

  async function deleteList(listName) {
    if (['planToWatch', 'watching', 'completed'].includes(listName)) return;
    setWatchlists(prev => {
      const next = { ...prev };
      delete next[listName];
      return next;
    });
    if (user) {
      await supabase.from("watchlists").delete().eq("user_id", user.id).eq("list_type", listName);
    }
  }

  function downloadMovie(movie, episodeInfo = null) {
    if (!user) { setShowAuth(true); return; }
    const downloadItem = {
      ...movie,
      downloadId: Date.now(),
      downloadedAt: new Date().toISOString(),
      episodeInfo // { season, episode, title } if applicable
    };
    setDownloads(prev => {
      const updated = [downloadItem, ...prev];
      localStorage.setItem(`ceninfo_downloads_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  }

  function removeDownload(downloadId) {
    if (!user) return;
    setDownloads(prev => {
      const updated = prev.filter(d => d.downloadId !== downloadId);
      localStorage.setItem(`ceninfo_downloads_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <LibraryContext.Provider value={{
      favorites,
      history,
      watchlists,
      toggleFavorite,
      isFavorite,
      addToHistory,
      updateWatchlist,
      getWatchlistStatus,
      createList,
      deleteList,
      downloads,
      downloadMovie,
      removeDownload
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  return useContext(LibraryContext);
}
