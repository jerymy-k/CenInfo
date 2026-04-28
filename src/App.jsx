import { supabase } from "./supabase";
import "./App.css";
import { useState, useEffect, useRef } from "react";
import Auth from "./Auth";
import logo from "./assets/CenInfoLogo.png";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com";
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const FILTERS = [
  { value: "", label: "Trending" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "documentary", label: "Documentaries" },
];

const SERVER_OPTIONS = ["Server Alpha", "Server Beta", "Server Gamma", "Server Delta"];

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
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [providers, setProviders] = useState(null);
  const [categories, setCategories] = useState({});
  const [loadingHome, setLoadingHome] = useState(false);

  // Watch section state
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const lastLoadedID = useRef(null);
  const searchInputRef = useRef(null);
  const railRefs = useRef({});
  const homeMovies = Object.values(categories).flatMap(section => section.movies || []);

  function saveMovieCache(movie) {
    if (!movie?.imdbID) return;
    try {
      sessionStorage.setItem("lastOpenedMovie", JSON.stringify(movie));
    } catch { }
  }

  function getCachedMovie(imdbID) {
    try {
      const cached = JSON.parse(sessionStorage.getItem("lastOpenedMovie") || "null");
      return cached?.imdbID === imdbID ? cached : null;
    } catch {
      return null;
    }
  }

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
    if (urlImdbID && lastLoadedID.current !== urlImdbID) {
      lastLoadedID.current = urlImdbID;
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

  useEffect(() => {
    if (!urlImdbID && selected) {
      setSelected(null);
      lastLoadedID.current = null;
    }
  }, [urlImdbID]);

  async function loadHomeMovies() {
    setLoadingHome(true);
    const endpoints = [
      { key: "trending", label: "Trending Now", url: `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}` },
      { key: "series", label: "Popular Series", url: `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}` },
      { key: "action", label: "Action Cinema", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=28` },
      { key: "comedy", label: "Comedy Picks", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=35` },
      { key: "documentary", label: "Documentaries", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99` },
      { key: "horror", label: "Horror Nights", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=27` },
    ];

    const results = {};
    await Promise.all(endpoints.map(async ({ key, label, url }) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.length) {
          results[key] = {
            label,
            movies: data.results.map(m => ({
              imdbID: m.imdb_id || `tmdb-${m.id}`,
              Title: m.title || m.name,
              Year: (m.release_date || m.first_air_date)?.split("-")[0],
              Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
              Type: m.title ? "movie" : "series",
            }))
          };
        }
      } catch { }
    }));

    setCategories(results);
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
      setCategories({});
      try {
        let url = "";
        let label = "";
        if (newType === "") {
          await loadHomeMovies();
          setLoadingHome(false);
          return;
        } else if (newType === "movie") {
          url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`;
          label = "Trending Movies";
        } else if (newType === "series") {
          url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`;
          label = "Trending Series";
        } else if (newType === "documentary") {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99`;
          label = "Documentaries";
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.length) {
          setCategories({
            filtered: {
              label,
              movies: data.results.map(m => ({
                imdbID: m.imdb_id || `tmdb-${m.id}`,
                Title: m.title || m.name,
                Year: (m.release_date || m.first_air_date)?.split("-")[0],
                Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
                Type: newType === "series" ? "series" : "movie",
              }))
            }
          });
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
    const cachedMovie = getCachedMovie(imdbID);
    const fallbackSource = knownMovie || cachedMovie;

    if (knownMovie) saveMovieCache(knownMovie);

    const fallbackMovie = fallbackSource ? {
      imdbID: fallbackSource.imdbID,
      Title: fallbackSource.Title || "Unknown title",
      Year: fallbackSource.Year || "N/A",
      Poster: fallbackSource.Poster || "N/A",
      Type: fallbackSource.Type || "movie",
      Runtime: fallbackSource.Runtime || "N/A",
      Genre: fallbackSource.Genre || "N/A",
      Plot: fallbackSource.Plot || "Full details are not available for this title yet.",
      imdbRating: fallbackSource.imdbRating || "N/A",
      Rated: fallbackSource.Rated || "N/A",
      Country: fallbackSource.Country || "N/A",
      Director: fallbackSource.Director || "N/A",
      Actors: fallbackSource.Actors || "N/A",
      Awards: fallbackSource.Awards || "N/A",
      Language: fallbackSource.Language || "N/A",
    } : null;

    if (fallbackSource?.Type === "series") tmdbMediaType = "tv";

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
        if (fallbackMovie) setSelected(fallbackMovie);
        setError("Full movie details were not found, but the title stays open.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/?i=${realImdbID}&plot=full&apikey=${API_KEY}`);
      const data = await res.json();

      if (data.Response === "False") {
        if (fallbackMovie) setSelected(fallbackMovie);
        setError(data.Error || "Full movie details were not found, but the title stays open.");
        setLoading(false);
        return;
      }

      setSelected(data);
      saveMovieCache(data);

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
    if (!imdbID) return;

    const clickedMovie = [...homeMovies, ...results, ...favorites].find(m => m.imdbID === imdbID);
    if (clickedMovie) saveMovieCache(clickedMovie);

    setShowFavorites(false);
    lastLoadedID.current = imdbID;
    navigate(`/movie/${imdbID}`);
    handleSelect(imdbID);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setSelected(null);
    setShowFavorites(false);
    navigate("/");
  }

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  const featuredMovie =
    categories.trending?.movies?.[0] ||
    categories.filtered?.movies?.[0] ||
    homeMovies[0] ||
    null;

  const topTrendingToday = categories.trending?.movies?.slice(0, 12) || [];
  const trendingSliderMovies = topTrendingToday.length ? topTrendingToday : homeMovies.slice(0, 12);

  function scrollRail(sectionKey, direction = 1) {
    const rail = railRefs.current[sectionKey];
    if (!rail) return;
    rail.scrollBy({
      left: direction * 720,
      behavior: "smooth",
    });
  }

  const totalPages = Math.ceil(totalResults / 12);

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-left">
          <img
            className="logo"
            src={logo}
            alt="CenInfo"
            onClick={goHome}
          />

          <nav className="nav-links-horizontal" aria-label="Main navigation">
            <button
              className={`nav-link-btn ${!showFavorites && !selected ? "active" : ""}`}
              onClick={goHome}
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

        <form
          className="search-pill"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <svg className="icon-search" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={searchInputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies, series, documentaries..."
            aria-label="Search titles"
          />
          <button className="search-submit" type="submit">Search</button>
        </form>

        <div className="header-right">
          {user && <span className="user-chip">{user.email}</span>}
          {user ? (
            <button className="auth-btn logout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          ) : (
            <button className="auth-btn login" onClick={() => setShowAuth(true)}>Sign In</button>
          )}
        </div>
      </header>

      <main className="scrollable-area">
        {loading ? (
          <div className="loader-container" aria-live="polite">
            <div className="spinner"></div>
          </div>
        ) : showFavorites ? (
          <div className="view-wrapper fade-in">
            <section className="library-hero">
              <p className="eyebrow">Personal collection</p>
              <h2 className="page-title">My Library</h2>
              <p className="hero-copy">All your saved movies and series in one clean watchlist.</p>
            </section>

            <div className="movie-grid">
              {favorites.length === 0 && (
                <div className="empty-state">
                  <h3>Your library is empty.</h3>
                  <p>Save titles you love and they will appear here.</p>
                </div>
              )}
              {favorites.map((movie) => (
                <MovieCard
                  key={movie.imdbID}
                  movie={movie}
                  onSelect={openDetails}
                  onToggleFav={toggleFavorite}
                  isFav={true}
                />
              ))}
            </div>
          </div>
        ) : selected ? (
          <div className="view-wrapper fade-in">
            <button className="back-link-btn" onClick={() => {
              setSelected(null);
              lastLoadedID.current = null;
              navigate("/");
            }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Back to explore
            </button>

            <div className="movie-details-hero">
              <div
                className="details-backdrop"
                style={{ backgroundImage: `url(${selected.Poster !== "N/A" ? selected.Poster : ""})` }}
              ></div>

              <div className="details-content">
                <div className="details-poster">
                  <img
                    src={selected.Poster !== "N/A" ? selected.Poster : "https://via.placeholder.com/400x600?text=No+Poster"}
                    alt={selected.Title}
                  />
                </div>

                <div className="details-info-panel">
                  <div className="details-kicker">
                    <span>{selected.Type || "Title"}</span>
                    <span>{selected.Rated !== "N/A" ? selected.Rated : "Cinema"}</span>
                    <span>{selected.Country !== "N/A" ? selected.Country : "International"}</span>
                  </div>

                  <div className="details-header">
                    <h1>{selected.Title}</h1>
                    <div className="rating-badge">
                      <span>IMDb</span>
                      {selected.imdbRating !== "N/A" ? selected.imdbRating : "--"}
                    </div>
                  </div>

                  <p className="details-subtitle">
                    {selected.Year} • {selected.Runtime} • {selected.Genre}
                  </p>

                  <div className="details-actions">
                    <button className="btn-primary" onClick={() => {
                      const trailerEl = document.getElementById("trailer-section");
                      if (trailerEl) trailerEl.scrollIntoView({ behavior: "smooth" });
                    }}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Watch Trailer</span>
                    </button>
                    <button
                      className={`btn-icon ${isFavorite(selected.imdbID) ? "active" : ""}`}
                      onClick={() => toggleFavorite(selected)}
                      aria-label="Add to library"
                    >
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>

                  <div className="details-description">
                    <h3 className="section-title">Synopsis</h3>
                    <p>{selected.Plot}</p>
                  </div>

                  {providers && (
                    <section className="provider-panel">
                      <h3 className="section-title">Where to Watch</h3>
                      <ProviderBlock title="Stream" providers={providers} type="flatrate" />
                      <ProviderBlock title="Rent" providers={providers} type="rent" />
                      <ProviderBlock title="Buy" providers={providers} type="buy" />
                    </section>
                  )}

                  {trailerUrl && (
                    <section id="trailer-section" className="trailer-panel">
                      <h3 className="section-title">Official Trailer</h3>
                      <div className="video-wrapper trailer-wrapper">
                        <iframe
                          src={trailerUrl}
                          title={`${selected.Title} trailer`}
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    </section>
                  )}

                </div>
              </div>
                  <div className="details-meta-grid">
                    <MetaItem label="Director" value={selected.Director} />
                    <MetaItem label="Cast" value={selected.Actors} />
                    <MetaItem label="Awards" value={selected.Awards} />
                    <MetaItem label="Language" value={selected.Language} />
                  </div>
            </div>

            <section className="watch-card watch-cinema-section">
              <div className="watch-layout">
                <aside className="watch-side-panel">
                  <div className="watch-mini-poster">
                    <img
                      src={selected.Poster !== "N/A" ? selected.Poster : "https://via.placeholder.com/400x600?text=No+Poster"}
                      alt={`${selected.Title} poster`}
                    />
                    <span>{selected.Type === "series" ? "Series" : "Movie"}</span>
                  </div>

                  <div className="watch-side-copy">
                    <p className="eyebrow">Now playing</p>
                    <h3>{selected.Title}</h3>
                    <p>{selected.Year} • {selected.Runtime} • {selected.Genre}</p>
                  </div>

                  <div className="watch-source-card">
                    <span>Current source</span>
                    <strong>{SERVER_OPTIONS[playerIndex]}</strong>
                  </div>
                </aside>

                <div className="watch-main-panel">
                  <div className="watch-topbar">
                    <div>
                      <span className="watch-label">Cinema player</span>
                      <strong>{selected.Title}</strong>
                    </div>

                    <span className="watch-status">
                      {selected.Type === "series"
                        ? `S${season} • E${episode}`
                        : selected.Year}
                    </span>
                  </div>

                  <div className="video-wrapper watch-cinema-video">
                    <iframe
                      src={[
                        selected.Type === "series" ? `https://vidsrc.me/embed/tv?imdb=${selected.imdbID}&season=${season}&episode=${episode}` : `https://vidsrc.me/embed/movie?imdb=${selected.imdbID}`,
                        selected.Type === "series" ? `https://vidsrc.to/embed/tv/${selected.imdbID}/${season}/${episode}` : `https://vidsrc.to/embed/movie/${selected.imdbID}`,
                        selected.Type === "series" ? `https://www.2embed.cc/embedtv/${selected.imdbID}&s=${season}&e=${episode}` : `https://www.2embed.cc/embed/${selected.imdbID}`,
                        selected.Type === "series" ? `https://multiembed.mov/?video_id=${selected.imdbID}&s=${season}&e=${episode}` : `https://multiembed.mov/?video_id=${selected.imdbID}`
                      ][playerIndex]}
                      key={`${selected.imdbID}-${season}-${episode}-${playerIndex}`}
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                      referrerPolicy="no-referrer"
                      allowFullScreen
                      title={`${selected.Title} player`}
                    />
                  </div>

                  <div className="watch-controls-panel">
                    {selected.Type === "series" && (
                      <div className="series-controls watch-series-controls">
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
                              <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                            ))}
                          </select>
                        </div>

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

                    <div className="player-selector-grid watch-server-grid">
                      {SERVER_OPTIONS.map((name, i) => (
                        <button
                          key={name}
                          className={`player-btn ${playerIndex === i ? "active" : ""}`}
                          onClick={() => setPlayerIndex(i)}
                        >
                          <span className="server-dot"></span>
                          <span>{name}</span>
                        </button>
                      ))}
                    </div>

                    <p className="watch-note">If the movie does not load, switch to another server.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="view-wrapper fade-in">
            {!query.trim() && featuredMovie && (
              <section className="home-hero featured-hero">
                <div
                  className="featured-backdrop"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(3,4,9,0.98) 0%, rgba(3,4,9,0.88) 34%, rgba(3,4,9,0.5) 100%), url(${featuredMovie.Poster !== "N/A" ? featuredMovie.Poster : ""})`
                  }}
                ></div>

                <div className="featured-main-row">
                  <div className="home-hero-content featured-hero-content">
                    <p className="eyebrow">Trending today</p>

                    <div className="featured-hero-meta">
                      <span>{featuredMovie.Type || "movie"}</span>
                      <span>{featuredMovie.Year || "New release"}</span>
                      <span>Top spotlight</span>
                    </div>

                    <h1>{featuredMovie.Title}</h1>
                    <p className="hero-copy">
                      Discover what people are watching right now. Open the featured title, continue browsing the live trending slider, or search any movie, series, or documentary.
                    </p>

                    <div className="hero-actions">
                      <button className="btn-primary" onClick={() => openDetails(featuredMovie.imdbID)}>
                        <span>View Details</span>
                      </button>
                      <button className="hero-secondary-btn" onClick={focusSearch}>Search Another Title</button>
                    </div>
                  </div>

                  <button className="featured-poster-card" onClick={() => openDetails(featuredMovie.imdbID)}>
                    <img
                      src={featuredMovie.Poster !== "N/A" ? featuredMovie.Poster : "https://via.placeholder.com/400x600?text=No+Poster"}
                      alt={featuredMovie.Title}
                    />
                    <span>Featured</span>
                  </button>
                </div>

                <div className="hero-slider-section">
                  <div className="hero-slider-header">
                    <div>
                      <p className="eyebrow">Live row</p>
                      <h3>Trending today</h3>
                    </div>
                    <span>{trendingSliderMovies.length || 0} titles moving right to left</span>
                  </div>

                  <TrendingSlider movies={trendingSliderMovies} onSelect={openDetails} />
                </div>
              </section>
            )}

            <div className="discover-header">
              <h2 className="page-title">{query.trim() ? "Search Results" : "Explore"}</h2>
              <div className="category-filters">
                {FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => handleTypeChange(filter.value)}
                    className={`filter-btn ${type === filter.value ? "active" : ""}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-card">{error}</div>}

            {query.trim() ? (
              <>
                <div className="results-summary">
                  <span>{results.length} titles shown</span>
                  {totalResults > 0 && <span>{totalResults} total results</span>}
                </div>

                <div className="movie-grid">
                  {results.length === 0 && !error && (
                    <div className="empty-state">
                      <h3>No results yet.</h3>
                      <p>Try another title or change the selected category.</p>
                    </div>
                  )}
                  {results.map((movie, i) => (
                    <MovieCard
                      key={movie.imdbID + i}
                      movie={movie}
                      onSelect={openDetails}
                      onToggleFav={toggleFavorite}
                      isFav={isFavorite(movie.imdbID)}
                    />
                  ))}
                </div>
              </>
            ) : loadingHome ? (
              <div className="loader-container"><div className="spinner"></div></div>
            ) : (
              Object.values(categories).map(({ label, movies }) => (
                <section key={label} className="content-section">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">Curated row</p>
                      <h3>{label}</h3>
                    </div>

                    <div className="section-actions">
                      <span>{movies.length} titles</span>
                      <div className="rail-nav">
                        <button
                          className="rail-nav-btn"
                          onClick={() => scrollRail(label, -1)}
                          aria-label={`Scroll ${label} left`}
                        >
                          ←
                        </button>
                        <button
                          className="rail-nav-btn"
                          onClick={() => scrollRail(label, 1)}
                          aria-label={`Scroll ${label} right`}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="movie-rail"
                    ref={(node) => {
                      if (node) railRefs.current[label] = node;
                    }}
                  >
                    {movies.map((movie, i) => (
                      <div key={movie.imdbID + i} className="rail-card-wrap">
                        <MovieCard
                          movie={movie}
                          onSelect={openDetails}
                          onToggleFav={toggleFavorite}
                          isFav={isFavorite(movie.imdbID)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            {query.trim() && results.length > 0 && (
              <div className="pagination-container">
                <button className="page-btn-modern" onClick={() => handleSearch(page - 1)} disabled={page === 1}>
                  ← Previous
                </button>
                <div className="page-indicator">
                  <span>{page}</span>
                  <span> / {totalPages}</span>
                </div>
                <button className="page-btn-modern" onClick={() => handleSearch(page + 1)} disabled={page >= totalPages}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {showAuth && !user && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowAuth(false)} aria-label="Close authentication modal">✕</button>
            <div className="modal-intro">
              <p className="eyebrow">Member access</p>
              <h2>Sign in to save your favorite titles.</h2>
            </div>
            <Auth />
          </div>
        </div>
      )}
    </div>
  );
}


function TrendingSlider({ movies, onSelect }) {
  if (!movies?.length) return null;

  const sliderMovies = [...movies, ...movies];

  return (
    <div className="auto-slider-window" aria-label="Trending movies slider">
      <div className="auto-slider-track">
        {sliderMovies.map((movie, index) => (
          <button
            key={`${movie.imdbID}-${index}`}
            className="auto-slider-card"
            onClick={() => onSelect(movie.imdbID)}
          >
            <img
              src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/240x360?text=No+Poster"}
              alt={movie.Title}
              loading="lazy"
            />
            <div className="auto-slider-info">
              <span>{movie.Type || "movie"}</span>
              <strong title={movie.Title}>{movie.Title}</strong>
              <small>{movie.Year || "Unknown year"}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="simple-footer">
      <div className="simple-footer-inner">
        <div className="simple-footer-brand">
          <span className="simple-footer-logo">CenInfo</span>
          <p>
            Cinema web app for discovering movies, series, trailers, and favorites.
          </p>
        </div>

        <div className="simple-footer-contact" aria-label="Contact links">
          <a href="mailto:karimimoha0@gmail.com">Email</a>
          <a href="https://github.com/jerymy-k" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/mohamed-elkerymy/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>

      <div className="simple-footer-bottom">
        <p>© 2026 CenInfo. All rights reserved.</p>
        <p>Created by ELKERYMY Mohamed.</p>
      </div>
    </footer>
  );
}

function ProviderBlock({ title, providers, type }) {
  if (!providers?.[type]?.length) return null;

  return (
    <div className="provider-block">
      <p>{title}</p>
      <div className="provider-group">
        {providers[type].map(provider => (
          <a
            key={provider.provider_id}
            href={providers.link}
            target="_blank"
            rel="noreferrer"
            title={provider.provider_name}
            aria-label={provider.provider_name}
          >
            <img
              className="provider-icon"
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  const displayValue = value && value !== "N/A" ? value : "Not available";

  return (
    <div className="meta-item">
      <span>{label}</span>
      <p>{displayValue}</p>
    </div>
  );
}

function MovieCard({ movie, onSelect, onToggleFav, isFav }) {
  const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";

  return (
    <article className="movie-card-item">
      <div className="poster-box" onClick={() => onSelect(movie.imdbID)}>
        <img src={poster} alt={movie.Title} loading="lazy" />
        <span className="poster-quality">HD</span>
        <div className="poster-overlay">
          <button
            className="quick-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(movie.imdbID);
            }}
          >
            View
          </button>
          <button
            className={`heart-btn ${isFav ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav(movie);
            }}
            aria-label="Save to library"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card-details" onClick={() => onSelect(movie.imdbID)}>
        <h5 title={movie.Title}>{movie.Title}</h5>
        <div className="card-meta">
          <span>{movie.Year || "Unknown"}</span>
          <span className="type-badge">{movie.Type || "movie"}</span>
        </div>
      </div>
    </article>
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
