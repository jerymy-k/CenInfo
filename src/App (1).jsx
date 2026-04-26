import { supabase } from "./supabase";
import "./App.css";
import { useState, useEffect, useRef } from "react";
import Auth from "./Auth";
import logo from "./assets/CenInfoLogo.png";
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com";
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

function Main() {
  const navigate = useNavigate();
  const { imdbID: urlImdbID } = useParams();
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
  const [loadingHome, setLoadingHome] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [providers, setProviders] = useState(null);
  const bottomRef = useRef(null);
  
  // Upgraded Watch Section State
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
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

    loadHomeMovies(1);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingHome && !query.trim()) {
        loadHomeMovies(homePage + 1);
      }
    }, { threshold: 1.0 });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [homePage, loadingHome, query]);

  useEffect(() => {
    if (urlImdbID) {
      handleSelect(urlImdbID);
    }
  }, [urlImdbID]);

  useEffect(() => {
    if (selected?.Type === "series" && selected?.imdbID) {
      loadEpisodes(selected.imdbID, season);
    } else {
      setEpisodes([]);
    }
  }, [selected, season]);

  async function loadHomeMovies(pg = 1) {
    setLoadingHome(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=${pg}`
    );
    const data = await res.json();
    if (data.results?.length) {
      const mapped = data.results.map(m => ({
        imdbID: m.imdb_id || `tmdb-${m.id}`,
        Title: m.title,
        Year: m.release_date?.split("-")[0],
        Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
        Type: "movie",
        tmdbId: m.id,
      }));
      setHomeMovies(prev => pg === 1 ? mapped : [...prev, ...mapped]);
      setHomePage(pg);
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
      const omdbPage1 = Math.ceil((newPage * 12 - 11) / 10);
      const omdbPage2 = Math.ceil((newPage * 12) / 10);

      const res1 = await fetch(`${BASE_URL}/?s=${query}&type=${type}&page=${omdbPage1}&apikey=${API_KEY}`);
      const data1 = await res1.json();

      let combined = [];
      let total = 0;

      if (data1.Response === "True") {
        combined = data1.Search;
        total = parseInt(data1.totalResults);

        if (omdbPage2 !== omdbPage1) {
          const res2 = await fetch(`${BASE_URL}/?s=${query}&type=${type}&page=${omdbPage2}&apikey=${API_KEY}`);
          const data2 = await res2.json();
          if (data2.Response === "True") {
            combined = [...combined, ...data2.Search];
          }
        }

        const startIndex = ((newPage - 1) * 12) % 10;
        setResults(combined.slice(startIndex, startIndex + 12));
        setTotalResults(total);
        setPage(newPage);
      } else {
        setResults([]);
        setError(data1.Error);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  async function handleTypeChange(newType) {
    setType(newType);
    setSelected(null);

    if (!query.trim()) {
      setLoadingHome(true);
      setHomeMovies([]);
      setHomePage(1);
      try {
        let url = "";
        if (newType === "" || newType === "movie") {
          url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=1`;
        } else if (newType === "series") {
          url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&page=1`;
        } else if (newType === "documentary") {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99&page=1`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.results?.length) {
          const mapped = data.results.map(m => ({
            imdbID: m.imdb_id || `tmdb-${m.id}`,
            Title: m.title || m.name,
            Year: (m.release_date || m.first_air_date)?.split("-")[0],
            Poster: m.poster_path
              ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
              : "https://via.placeholder.com/300x450?text=No+Poster",
            Type: newType || "movie",
            tmdbId: m.id,
          }));
          setHomeMovies(mapped);
        }
      } catch {
        setError("Something went wrong.");
      }
      setLoadingHome(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const typeParam = newType === "documentary" ? "movie" : newType;
      const res = await fetch(`${BASE_URL}/?s=${query}&type=${typeParam}&page=1&apikey=${API_KEY}`);
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
    setError("");
    setSelected(null);
    setTrailerUrl(null);
    setProviders(null);
    setShowFavorites(false);
    setSeason(1);
    setEpisode(1);
    setPlayerIndex(0);
    setEpisodes([]);
    setLoadingEpisodes(false);

    let realImdbID = imdbID;
    let tmdbMediaType = "movie";

    const knownMovie = [...homeMovies, ...results, ...favorites].find(m => m.imdbID === imdbID);
    if (knownMovie?.Type === "series") tmdbMediaType = "tv";

    try {
      if (imdbID.startsWith("tmdb-")) {
        const tmdbId = imdbID.replace("tmdb-", "");
        let extRes = await fetch(
          `https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`
        );
        let extData = await extRes.json();

        if (!extData.imdb_id && tmdbMediaType === "movie") {
          extRes = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_KEY}`
          );
          extData = await extRes.json();
          tmdbMediaType = "tv";
        }

        realImdbID = extData.imdb_id;
      }

      if (!realImdbID) {
        setError("Movie details not found.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/?i=${realImdbID}&plot=full&apikey=${API_KEY}`);
      const data = await res.json();

      if (data.Response === "False") {
        setError(data.Error || "Movie details not found.");
        setLoading(false);
        return;
      }

      setSelected(data);

      const mediaType = data.Type === "series" ? "tv" : "movie";
      const cleanYear = data.Year?.split("–")[0]?.split("-")[0];
      const searchUrl = mediaType === "tv"
        ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(data.Title)}&first_air_date_year=${cleanYear}&api_key=${TMDB_KEY}`
        : `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(data.Title)}&year=${cleanYear}&api_key=${TMDB_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.results?.length) {
        const tmdbId = searchData.results[0].id;
        const url = await fetchTrailer(data.Title, cleanYear, mediaType);
        setTrailerUrl(url);
        await fetchProviders(tmdbId, mediaType);
      }
    } catch {
      setError("Something went wrong.");
    }

    setLoading(false);
  }


  async function fetchTrailer(title, year, mediaType = "movie") {
    try {
      const searchUrl = mediaType === "tv"
        ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(title)}&first_air_date_year=${year}&api_key=${TMDB_KEY}`
        : `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&year=${year}&api_key=${TMDB_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (!searchData.results?.length) return null;

      const tmdbId = searchData.results[0].id;
      const videoRes = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${TMDB_KEY}`
      );
      const videoData = await videoRes.json();
      const trailer = videoData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch {
      return null;
    }
  }

  async function fetchProviders(tmdbId, mediaType = "movie") {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${TMDB_KEY}`
      );
      const data = await res.json();
      const countryData = data.results?.MA || data.results?.US || null;
      setProviders(countryData);
    } catch {
      setProviders(null);
    }
  }

  async function loadEpisodes(imdbID, seasonNumber) {
    setLoadingEpisodes(true);

    try {
      const res = await fetch(
        `${BASE_URL}/?i=${imdbID}&Season=${seasonNumber}&apikey=${API_KEY}`
      );
      const data = await res.json();

      if (data.Response === "True" && data.Episodes?.length) {
        setEpisodes(data.Episodes);

        const episodeStillExists = data.Episodes.some(ep => Number(ep.Episode) === Number(episode));
        if (!episodeStillExists) {
          setEpisode(Number(data.Episodes[0].Episode));
        }
      } else {
        setEpisodes([]);
        setEpisode(1);
      }
    } catch {
      setEpisodes([]);
      setEpisode(1);
    }

    setLoadingEpisodes(false);
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

  function openDetails(imdbID) {
    navigate(`/movie/${imdbID}`);
  }

  return (
    <div className="app-container">
      {/* ================= NEW HEADER REPLACING SIDEBAR ================= */}
      <header className="main-header">
        <div className="header-left">
          <img 
            className="logo" 
            src={logo} 
            alt="app-logo" 
            onClick={() => { setSelected(null); setShowFavorites(false); navigate('/'); }} 
          />
          <nav className="nav-links-horizontal">
            <button 
              className={`nav-link-btn ${!showFavorites && !selected ? "active" : ""}`}
              onClick={() => { setShowFavorites(false); setSelected(null); navigate('/'); }}
            >
              Explore
            </button>
            <button 
              className={`nav-link-btn ${showFavorites ? "active" : ""}`}
              onClick={() => {
                if (!user) { setShowAuth(true); return; }
                setShowFavorites(true);
                setSelected(null);
              }}
            >
              My Library
              {favorites.length > 0 && <span className="nav-badge">{favorites.length}</span>}
            </button>
          </nav>
        </div>

        <div className="search-pill">
          <svg className="icon-search" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search movies, shows, directors..."
          />
        </div>

        <div className="header-right">
          {user ? (
            <button className="auth-btn logout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          ) : (
            <button className="auth-btn login" onClick={() => setShowAuth(true)}>Sign In</button>
          )}
        </div>
      </header>

      {/* ================= MAIN VIEWPORT ================= */}
      <main className="scrollable-area">
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        ) : showFavorites ? (
          <div className="view-wrapper fade-in">
            <h2 className="page-title" style={{ marginBottom: '2rem' }}>My Collection</h2>
            <div className="movie-grid">
              {favorites.length === 0 && <div className="empty-state">Your library is waiting.</div>}
              {favorites.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} onSelect={openDetails} onToggleFav={toggleFavorite} isFav={true} />
              ))}
            </div>
          </div>

        ) : selected ? (
          <div className="view-wrapper fade-in">
            <button className="back-link-btn" onClick={() => { setSelected(null); navigate('/'); }}>                
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
              Back to explore
            </button>

            <div className="movie-details-hero">
              <div className="details-backdrop" style={{ backgroundImage: `url(${selected.Poster !== "N/A" ? selected.Poster : ""})` }}></div>
              <div className="details-content">
                <div className="details-poster">
                  <img src={selected.Poster !== "N/A" ? selected.Poster : "https://via.placeholder.com/400x600"} alt={selected.Title} />
                </div>
                <div className="details-info-panel">
                  <div className="details-header">
                    <h1>{selected.Title}</h1>
                    <div className="rating-badge"><span>IMDb</span> {selected.imdbRating}</div>
                  </div>
                  <p className="details-subtitle">{selected.Year} • {selected.Runtime} • {selected.Genre}</p>

                  <div className="details-actions">
                    <button className="btn-primary" onClick={() => {
                      const trailerEl = document.getElementById("trailer-section");
                      if (trailerEl) trailerEl.scrollIntoView({ behavior: "smooth" });
                    }}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Watch Trailer
                    </button>
                    <button className={`btn-icon ${isFavorite(selected.imdbID) ? "active" : ""}`} onClick={() => toggleFavorite(selected)}>
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </button>
                  </div>

                  <div className="details-description">
                    <h3 className="section-title">Synopsis</h3>
                    <p>{selected.Plot}</p>
                  </div>

                  {providers && (
                    <div style={{ marginTop: "2rem" }}>
                      <h3 className="section-title">Where to Watch</h3>
                      {/* Provider mapping logic remains unchanged */}
                      {providers.flatrate && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ color: "#888", fontSize: 13, marginBottom: 8, textTransform: "uppercase" }}>Stream</p>
                          <div className="provider-group">
                            {providers.flatrate.map(p => (
                              <a key={p.provider_id} href={providers.link} target="_blank" rel="noreferrer" title={p.provider_name}>
                                <img className="provider-icon" src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {providers.rent && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ color: "#888", fontSize: 13, marginBottom: 8, textTransform: "uppercase" }}>Rent</p>
                          <div className="provider-group">
                            {providers.rent.map(p => (
                              <a key={p.provider_id} href={providers.link} target="_blank" rel="noreferrer" title={p.provider_name}>
                                <img className="provider-icon" src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {trailerUrl && (
                    <div id="trailer-section" style={{ marginTop: "2.5rem" }}>
                      <h3 className="section-title">Trailer</h3>
                      <div className="video-wrapper">
                        <iframe src={trailerUrl} title="Trailer" allowFullScreen />
                      </div>
                    </div>
                  )}

                  <div className="details-meta-grid" style={{ marginTop: "2rem", display: 'flex', gap: '3rem' }}>
                    <div className="meta-item">
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>Director</span>
                      <p style={{ fontWeight: 600, marginTop: "4px" }}>{selected.Director}</p>
                    </div>
                    <div className="meta-item">
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>Starring</span>
                      <p style={{ fontWeight: 600, marginTop: "4px" }}>{selected.Actors}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= UPGRADED WATCH SECTION ================= */}
            {/* ================= UPGRADED WATCH SECTION ================= */}
<section className="watch-card">
  <h3 className="section-title" style={{ marginBottom: "1.5rem" }}>Streaming Hub</h3>
  
  {selected.Type === "series" && (
    <div className="series-controls">
      {/* SEASON SELECT - Controlled by your totalSeasons logic */}
      <div className="select-group">
        <label>Season</label>
        <select 
          className="custom-select" 
          value={season} 
          onChange={e => {
            setSeason(Number(e.target.value));
            setEpisode(1);
          }}
        >
          {[...Array(parseInt(selected.totalSeasons && selected.totalSeasons !== "N/A" ? selected.totalSeasons : 1)).keys()].map(i => (
            <option key={i+1} value={i+1}>Season {i+1}</option>
          ))}
        </select>
      </div>
      
      {/* EPISODE SELECT - Shows only available episodes for the selected season */}
      <div className="select-group">
        <label>Episode</label>
        <select 
          className="custom-select" 
          value={episode}
          disabled={loadingEpisodes || episodes.length === 0}
          onChange={e => setEpisode(Number(e.target.value))}
        >
          {loadingEpisodes ? (
            <option value={episode}>Loading...</option>
          ) : episodes.length > 0 ? (
            episodes.map(ep => (
              <option key={ep.imdbID || ep.Episode} value={Number(ep.Episode)}>
                Episode {ep.Episode} - {ep.Title}
              </option>
            ))
          ) : (
            <option value={1}>No episodes found</option>
          )}
        </select>
      </div>

    </div>
  )}

  <div className="player-selector-grid">
    {['Server Alpha', 'Server Beta', 'Server Gamma', 'Server Delta'].map((name, i) => (
      <button 
        key={i} 
        className={`player-btn ${playerIndex === i ? 'active' : ''}`}
        onClick={() => setPlayerIndex(i)}
      >
        {name}
      </button>
    ))}
  </div>

  <div className="video-wrapper">
    <iframe
      src={[
        selected.Type === "series" ? `https://vidsrc.to/embed/tv/${selected.imdbID}/${season}/${episode}` : `https://vidsrc.to/embed/movie/${selected.imdbID}`,
        selected.Type === "series" ? `https://www.2embed.cc/embedtv/${selected.imdbID}&s=${season}&e=${episode}` : `https://www.2embed.cc/embed/${selected.imdbID}`,
        selected.Type === "series" ? `https://vidsrc.me/embed/tv?imdb=${selected.imdbID}&season=${season}&episode=${episode}` : `https://vidsrc.me/embed/movie?imdb=${selected.imdbID}`,
        selected.Type === "series" ? `https://multiembed.mov/?video_id=${selected.imdbID}&s=${season}&e=${episode}` : `https://multiembed.mov/?video_id=${selected.imdbID}`
      ][playerIndex]}
      allowFullScreen
      title="Player"
    />
  </div>
</section>
          </div>

        ) : (
          <div className="view-wrapper fade-in">
            <div className="discover-header">
              <h2 className="page-title">Explore</h2>
              <div className="category-filters">
                {["", "movie", "series", "documentary"].map(t => (
                  <button key={t} onClick={() => handleTypeChange(t)} className={`filter-btn ${type === t ? "active" : ""}`}>
                    {t === "" ? "Trending" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-card" style={{ padding: '1rem', background: 'rgba(229,9,20,0.1)', border: '1px solid #e50914', borderRadius: '12px', color: '#ff6b6b', marginBottom: '2rem' }}>{error}</div>}

            <div className="movie-grid">
              {(query.trim() ? results : homeMovies).map((movie, i) => (
                <MovieCard key={movie.imdbID + i} movie={movie} onSelect={openDetails} onToggleFav={toggleFavorite} isFav={isFavorite(movie.imdbID)} />
              ))}
            </div>

            {!query.trim() && (
              <div ref={bottomRef} className="loader-container">
                {loadingHome && <div className="spinner"></div>}
              </div>
            )}

            {/* ================= UPGRADED PAGINATION ================= */}
            {query.trim() && results.length > 0 && (
              <div className="pagination-container">
                <button className="page-btn-modern" onClick={() => handleSearch(page - 1)} disabled={page === 1}>
                  ← Previous
                </button>
                <div className="page-indicator">
                  <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{page}</span> 
                  <span style={{color: 'var(--text-muted)'}}> / {Math.ceil(totalResults / 12)}</span>
                </div>
                <button className="page-btn-modern" onClick={() => handleSearch(page + 1)} disabled={page >= Math.ceil(totalResults / 12)}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {showAuth && !user && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#121212', padding: '2rem', borderRadius: '16px', position: 'relative', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="modal-close" onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <Auth />
          </div>
        </div>
      )}
    </div>
  );
}

function MovieCard({ movie, onSelect, onToggleFav, isFav }) {
  return (
    <div className="movie-card-item">
      <div className="poster-box" onClick={() => onSelect(movie.imdbID)}>
        <img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.Title} loading="lazy" />
        <div className="poster-overlay">
          <button className={`heart-btn ${isFav ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleFav(movie); }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </button>
        </div>
      </div>
      <div className="card-details" onClick={() => onSelect(movie.imdbID)}>
        <h5 title={movie.Title}>{movie.Title}</h5>
        <div className="card-meta">
          <span>{movie.Year}</span>
          <span className="type-badge">{movie.Type}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/movie/:imdbID" element={<Main />} />
    </Routes>
  );
}