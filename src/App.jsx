import { supabase } from "./supabase";
import "./App.css";
import { useState, useEffect, useRef } from "react";
import Auth from "./Auth";

const API_KEY = "1aaf70c8";
const BASE_URL = "https://www.omdbapi.com";
const POPULAR = ["mafia", "heat", "suit", "mafia", "al patcino", "matrix", "avatar", "titanic", "italian", "john wick", "the godfather", "harry potter"];

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [homeMovies, setHomeMovies] = useState([]);
  const [homePage, setHomePage] = useState(1);
  const [homeKeyIndex, setHomeKeyIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(false);
  const bottomRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadFavorites(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadFavorites(session.user.id);
    });

    loadHomeMovies(1, 0);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingHome && !query.trim()) {
        loadHomeMovies(homePage + 1, homeKeyIndex);
      }
    }, { threshold: 1.0 });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [homePage, homeKeyIndex, loadingHome, query]);

  async function loadHomeMovies(pg = 1, keyIndex = 0) {
    setLoadingHome(true);
    const keyword = POPULAR[keyIndex % POPULAR.length];
    const res = await fetch(`${BASE_URL}/?s=${keyword}&page=${pg}&apikey=${API_KEY}`);
    const data = await res.json();
    if (data.Response === "True") {
      setHomeMovies(prev => [...prev, ...data.Search]);
      setHomePage(pg);
      setHomeKeyIndex(keyIndex);
    } else {
      await loadHomeMovies(1, keyIndex + 1);
    }
    setLoadingHome(false);
  }

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

  async function handleSearch(newPage = 1) {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch(`${BASE_URL}/?s=${query}&type=${type}&page=${newPage}&apikey=${API_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        setResults(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setPage(newPage);
      } else {
        setResults([]);
        setError(data.Error);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  async function handleTypeChange(newType) {
    setType(newType);
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch(`${BASE_URL}/?s=${query}&type=${newType}&page=1&apikey=${API_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        setResults(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setPage(1);
      } else {
        setResults([]);
        setError(data.Error);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  async function handleSelect(imdbID) {
    setLoading(true);
    setSelected(null);
    setShowFavorites(false);
    const res = await fetch(`${BASE_URL}/?i=${imdbID}&plot=full&apikey=${API_KEY}`);
    const data = await res.json();
    setSelected(data);
    setLoading(false);
  }

  async function toggleFavorite(movie) {
    if (isFavorite(movie.imdbID)) {
      await supabase.from("favorites").delete().eq("imdb_id", movie.imdbID);
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

  if (!user) return <Auth />;
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 className="logo">Cen<span>Info</span></h1>
        </div>
        <nav className="nav-menu">
          <button
            className={`nav-link ${!showFavorites && !selected ? "active" : ""}`}
            onClick={() => { setShowFavorites(false); setSelected(null); }}
          >
            <span className="nav-icon">🏠</span> Home
          </button>
          <button
            className={`nav-link ${showFavorites ? "active" : ""}`}
            onClick={() => { setShowFavorites(true); setSelected(null); }}
          >
            <span className="nav-icon">♥</span> Favorites
            {favorites.length > 0 && <span className="nav-badge">{favorites.length}</span>}
          </button>
        </nav>
        <div className="sidebar-promo">
          <div className="promo-box">
            <h4>Go Premium</h4>
            <p>Enjoy CenInfo without any interruptions.</p>
            <button className="promo-btn">Upgrade</button>
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: "none", border: "1px solid #e50914", color: "#e50914", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, margin: "1rem" }}
        >
          Logout
        </button>
      </aside>

      <main className="main-viewport">
        <header className="top-navigation">
          <div className="search-pill">
            <span className="icon-search">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search movies, series..."
            />
            <button className="search-action" onClick={() => handleSearch()}>Search</button>
          </div>
        </header>

        <div className="scrollable-area">
          {showFavorites ? (
            <div className="view-wrapper fade-in">
              <h2 className="page-title">My Collection</h2>
              <div className="movie-grid">
                {favorites.length === 0 && <p className="empty-msg">No favorites added yet.</p>}
                {favorites.map(movie => (
                  <MovieCard key={movie.imdbID} movie={movie} onSelect={handleSelect} onToggleFav={toggleFavorite} isFav={true} />
                ))}
              </div>
            </div>

          ) : selected ? (
            <div className="view-wrapper fade-in">
              <button className="back-link-btn" onClick={() => setSelected(null)}>← Return to Browse</button>
              <div className="movie-details-hero">
                <div className="details-poster">
                  <img src={selected.Poster !== "N/A" ? selected.Poster : "https://via.placeholder.com/400x600"} alt={selected.Title} />
                </div>
                <div className="details-info-panel">
                  <div className="details-header">
                    <h1>{selected.Title}</h1>
                    <span className="imdb-pill">⭐ {selected.imdbRating}</span>
                  </div>
                  <p className="details-subtitle">{selected.Year} • {selected.Runtime} • {selected.Genre}</p>
                  <div className="details-description">
                    <h3>Overview</h3>
                    <p>{selected.Plot}</p>
                  </div>
                  <div className="details-meta-grid">
                    <div><strong>Director</strong><p>{selected.Director}</p></div>
                    <div><strong>Actors</strong><p>{selected.Actors}</p></div>
                  </div>
                  <button
                    className={`btn-favorite ${isFavorite(selected.imdbID) ? "active" : ""}`}
                    onClick={() => toggleFavorite(selected)}
                  >
                    {isFavorite(selected.imdbID) ? "Remove from Favorites" : "Add to Favorites"}
                  </button>
                </div>
              </div>
            </div>

          ) : (
            <div className="view-wrapper fade-in">
              <div className="category-filters">
                {["", "movie", "series", "episode"].map(t => (
                  <button key={t} onClick={() => handleTypeChange(t)} className={`filter-btn ${type === t ? "active" : ""}`}>
                    {t === "" ? "All Content" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {loading && <div className="loader-ring"><div></div><div></div></div>}
              {error && <div className="error-card">{error}</div>}

              <div className="movie-grid">
                {(query.trim() ? results : homeMovies).map((movie, i) => (
                  <MovieCard
                    key={movie.imdbID + i}
                    movie={movie}
                    onSelect={handleSelect}
                    onToggleFav={toggleFavorite}
                    isFav={isFavorite(movie.imdbID)}
                  />
                ))}
              </div>

              {!query.trim() && (
                <div ref={bottomRef} style={{ height: 40, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {loadingHome && <p className="status">Loading more...</p>}
                </div>
              )}

              {query.trim() && results.length > 0 && (
                <div className="footer-pagination">
                  <button className="page-nav" onClick={() => handleSearch(page - 1)} disabled={page === 1}>Prev</button>
                  <span className="page-info">Page {page} / {Math.ceil(totalResults / 12)}</span>
                  <button className="page-nav" onClick={() => handleSearch(page + 1)} disabled={page >= Math.ceil(totalResults / 12)}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MovieCard({ movie, onSelect, onToggleFav, isFav }) {
  return (
    <div className="movie-card-item">
      <div className="poster-box">
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450"}
          alt={movie.Title}
          onClick={() => onSelect(movie.imdbID)}
        />
        <button className={`heart-btn ${isFav ? "active" : ""}`} onClick={() => onToggleFav(movie)}>
          {isFav ? "♥" : "♡"}
        </button>
      </div>
      <div className="card-details" onClick={() => onSelect(movie.imdbID)}>
        <h5>{movie.Title}</h5>
        <span>{movie.Year}</span>
      </div>
    </div>
  );
}