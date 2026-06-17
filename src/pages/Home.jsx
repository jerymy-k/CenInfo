import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchHomeCategories, fetchFilteredCategory, searchMovies, fetchUpcomingMovies, fetchRecommendationsByMovieId } from "../services/api";
import MovieCard from "../components/MovieCard";

const FILTERS = [
  { value: "", label: "Trending" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "documentary", label: "Documentaries" },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filterYear, setFilterYear] = useState("");
  const [categories, setCategories] = useState({});
  const [loadingHome, setLoadingHome] = useState(false);

  const railRefs = useRef({});
  const { toggleFavorite, isFavorite, history, favorites } = useAuth();

  useEffect(() => {
    if (query.trim()) {
      handleSearch(1, filterYear, query);
    } else {
      setResults([]);
      handleTypeChange(type);
    }
  }, [query]);

  async function loadHomeMovies() {
    setLoadingHome(true);
    const data = await fetchHomeCategories();
    
    const upcoming = await fetchUpcomingMovies();
    if (upcoming) data.upcoming = upcoming;

    if (favorites?.length > 0) {
      const fav = favorites[favorites.length - 1];
      if (fav.imdbID.startsWith('tmdb-')) {
        const isTv = fav.imdbID.includes('-tv-');
        const tmdbId = fav.imdbID.replace(/tmdb-(tv|movie)-/, '');
        const recommendations = await fetchRecommendationsByMovieId(tmdbId, isTv ? "tv" : "movie");
        if (recommendations) data.forYou = recommendations;
      }
    }

    setCategories(data);
    setLoadingHome(false);
  }

  async function handleSearch(newPage = 1, year = filterYear, q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    
    const { results: newResults, totalResults: total, error: apiError } = await searchMovies(q, type, newPage, year);
    
    if (apiError) {
      setResults([]);
      setError(apiError);
    } else {
      setResults(newResults);
      setTotalResults(total);
      setPage(newPage);
    }
    setLoading(false);
  }

  async function handleTypeChange(newType) {
    setType(newType);

    if (!query.trim()) {
      setLoadingHome(true);
      setCategories({});
      
      if (newType === "") {
        await loadHomeMovies();
      } else {
        const data = await fetchFilteredCategory(newType);
        if (data) {
          setCategories({ filtered: data });
        }
      }
      setLoadingHome(false);
      return;
    }

    setLoading(true);
    setError("");
    const { results: newResults, totalResults: total, error: apiError } = await searchMovies(query, newType, 1, filterYear);
    
    if (apiError) {
      setResults([]);
      setError(apiError);
    } else {
      setResults(newResults);
      setTotalResults(total);
      setPage(1);
    }
    setLoading(false);
  }

  function scrollRail(sectionKey, direction = 1) {
    const rail = railRefs.current[sectionKey];
    if (!rail) return;
    const scrollAmount = rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }

  const homeMovies = Object.values(categories).flatMap(section => section.movies || []);
  const featuredMovie = categories.trending?.movies?.[0] || categories.filtered?.movies?.[0] || homeMovies[0] || null;

  return (
    <motion.div 
      className="view-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {!query.trim() && featuredMovie && (
        <section className="cinematic-hero">
          <motion.div
            className="hero-backdrop"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              backgroundImage: `url(${featuredMovie.Poster !== "N/A" ? featuredMovie.Poster.replace('w500', 'original') : ""})`
            }}
          />

          <div className="hero-content">
            <motion.div 
              className="hero-meta"
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <span className="hero-badge">{featuredMovie.Type || "movie"}</span>
              <span>{featuredMovie.Year || "New Release"}</span>
              <span style={{ color: "var(--accent-fuchsia)" }}>#1 Trending</span>
            </motion.div>

            <motion.h1 
              className="hero-title text-gradient"
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            >
              {featuredMovie.Title}
            </motion.h1>

            <motion.p 
              className="hero-plot"
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            >
              Immerse yourself in the world of {featuredMovie.Title}. Discover what people are watching right now and explore the most trending titles of the day.
            </motion.p>

            <motion.div 
              className="hero-actions"
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            >
              <Link to={`/movie/${featuredMovie.imdbID}`} className="btn-primary">
                <Play size={20} fill="currentColor" />
                <span>Watch Details</span>
              </Link>
              <button className="btn-secondary" onClick={() => {
                const searchBtn = document.querySelector('.search-trigger');
                if(searchBtn) searchBtn.click();
              }}>
                <SearchIcon size={20} />
                <span>Explore More</span>
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {!query.trim() && !loadingHome && history.length > 0 && (
        <section className="content-section" style={{ paddingBottom: 0, marginTop: '20px' }}>
          <div className="section-header">
            <div>
              <p>Continue Watching</p>
              <h2>Jump Back In</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="close-search-btn" style={{ width: '40px', height: '40px' }} onClick={() => scrollRail('history', -1)}>
                <ChevronLeft />
              </button>
              <button className="close-search-btn" style={{ width: '40px', height: '40px' }} onClick={() => scrollRail('history', 1)}>
                <ChevronRight />
              </button>
            </div>
          </div>
          <div
            className="rail-container"
            ref={(node) => { if (node) railRefs.current['history'] = node; }}
          >
            {history.map((movie, i) => (
              <MovieCard
                key={`history-${movie.imdbID}-${i}`}
                movie={movie}
                index={i}
                onToggleFav={toggleFavorite}
                isFav={isFavorite(movie.imdbID)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="discover-header" style={{ padding: '0 5%', marginTop: query.trim() ? '120px' : '40px' }}>
        <h2 className="page-title">{query.trim() ? "Search Results" : "Explore Categories"}</h2>
        <div className="filters-container">
          {FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => handleTypeChange(filter.value)}
              className={`filter-btn ${type === filter.value ? "active" : ""}`}
            >
              {filter.label}
            </button>
          ))}
          {query.trim() && (
            <select className="modern-select" value={filterYear} onChange={(e) => { setFilterYear(e.target.value); handleSearch(1, e.target.value, query); }}>
              <option value="">Any Year</option>
              {Array.from({length: 40}, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <div className="error-card" style={{ margin: '0 5%' }}>{error}</div>}

      {query.trim() ? (
        <div style={{ padding: '0 5%' }}>
          <div className="results-summary" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
            <span>{results.length} titles shown</span>
            {totalResults > 0 && <span> • {totalResults} total results</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: '16px' }}>
            {results.map((movie, i) => (
              <MovieCard
                key={movie.imdbID + i}
                movie={movie}
                index={i}
                onToggleFav={toggleFavorite}
                isFav={isFavorite(movie.imdbID)}
              />
            ))}
          </div>
        </div>
      ) : loadingHome ? (
        <div className="rail-container">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="movie-card" style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>
      ) : (
        Object.values(categories).map(({ label, movies }) => (
          <section key={label} className="content-section">
            <div className="section-header">
              <div>
                <p>Curated Collection</p>
                <h2>{label}</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="close-search-btn" style={{ width: '40px', height: '40px' }} onClick={() => scrollRail(label, -1)}>
                  <ChevronLeft />
                </button>
                <button className="close-search-btn" style={{ width: '40px', height: '40px' }} onClick={() => scrollRail(label, 1)}>
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div
              className="rail-container"
              ref={(node) => {
                if (node) railRefs.current[label] = node;
              }}
            >
              {movies.map((movie, i) => (
                <MovieCard
                  key={movie.imdbID + i}
                  movie={movie}
                  index={i}
                  onToggleFav={toggleFavorite}
                  isFav={isFavorite(movie.imdbID)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </motion.div>
  );
}
