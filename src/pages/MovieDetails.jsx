import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowLeft, Star, Clock, Calendar, Globe, Heart, Server, MonitorPlay, ListVideo, Lightbulb, User, X, Film, BookmarkPlus, CheckCircle, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMovieDetails, fetchTrailer, fetchProviders, fetchEpisodes, fetchRecommendations, fetchCast, fetchReviews, fetchTmdbMovieInfo, fetchMovieCollection } from "../services/api";
import ReviewSection from "../components/ReviewSection";
import ProviderBlock from "../components/ProviderBlock";
import MovieCard from "../components/MovieCard";
import { supabase } from "../supabase";

const SERVER_OPTIONS = ["Server Alpha", "Server Beta", "Server Gamma", "Server Delta"];

export default function MovieDetails() {
  const { imdbID } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuth, toggleFavorite, isFavorite, addToHistory, updateWatchlist, getWatchlistStatus } = useAuth();
  
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [providers, setProviders] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [cast, setCast] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [collection, setCollection] = useState(null);
  const [tmdbIdState, setTmdbIdState] = useState(null);
  
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showWatchlistMenu, setShowWatchlistMenu] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  
  const iframeRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (user) {
      supabase.from("watched_episodes").select("episode_id").eq("user_id", user.id).then(({ data }) => {
        if (data) setWatchedEpisodes(data.map(r => r.episode_id));
      });
    } else {
      setWatchedEpisodes([]);
    }
  }, [user]);

  // Sync sidebar height perfectly with the 16:9 video player
  useEffect(() => {
    if (!playerContainerRef.current || !controlsRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === playerContainerRef.current) {
          controlsRef.current.style.height = `${entry.contentRect.height}px`;
        }
      }
    });
    
    observer.observe(playerContainerRef.current);
    return () => observer.disconnect();
  }, [selected]);

  const toggleWatched = async (epId, e) => {
    e.stopPropagation();
    
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setWatchedEpisodes(prev => {
      let newWatched;
      const isRemoving = prev.includes(epId);
      if (isRemoving) {
        newWatched = prev.filter(id => id !== epId);
      } else {
        newWatched = [...prev, epId];
      }
      
      if (isRemoving) {
        supabase.from("watched_episodes").delete().eq("user_id", user.id).eq("episode_id", epId).then();
      } else {
        supabase.from("watched_episodes").insert({ user_id: user.id, episode_id: epId }).then();
      }
      
      return newWatched;
    });
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      setTrailerUrl(null);
      setProviders(null);
      setRecommendations([]);
      setCast([]);
      setReviews([]);
      
      const { data, error: apiError, mediaType, tmdbId, cleanYear } = await fetchMovieDetails(imdbID);
      
      if (apiError || !data) {
        setError(apiError || "Something went wrong.");
        setLoading(false);
        return;
      }
      
      setSelected(data);
      setTmdbIdState(tmdbId);
      
      if (tmdbId) {
        fetchTrailer(data.Title, cleanYear, mediaType).then(setTrailerUrl);
        fetchProviders(tmdbId, mediaType).then(setProviders);
        fetchRecommendations(tmdbId, mediaType).then(setRecommendations);
        fetchCast(tmdbId, mediaType).then(setCast);
        fetchReviews(tmdbId, mediaType).then(setReviews);
        
        fetchTmdbMovieInfo(tmdbId, mediaType).then(info => {
          if (info?.belongs_to_collection) {
            fetchMovieCollection(info.belongs_to_collection.id).then(setCollection);
          }
        });
      }
      
      setLoading(false);
    }
    
    if (imdbID) {
      loadData();
    }
  }, [imdbID]);

  useEffect(() => {
    if (selected?.Type === "series" && selected?.imdbID) {
      setLoadingEpisodes(true);
      fetchEpisodes(selected.imdbID, season).then(eps => {
        setEpisodes(eps);
        const episodeStillExists = eps.some(ep => Number(ep.Episode) === Number(episode));
        if (!episodeStillExists && eps.length > 0) {
          setEpisode(Number(eps[0].Episode));
        } else if (eps.length === 0) {
          setEpisode(1);
        }
        setLoadingEpisodes(false);
      });
    } else {
      setEpisodes([]);
    }
  }, [selected, season]);

  // Disable body scroll when theater mode is active
  useEffect(() => {
    if (theaterMode) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [theaterMode]);

  if (loading) return <div style={{ height: '100vh', background: 'var(--bg-base)' }}></div>;

  if (error || !selected) {
    return (
      <div className="view-wrapper" style={{ padding: '120px 5%' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 style={{ marginTop: '20px' }}>{error || "Movie not found"}</h2>
      </div>
    );
  }

  const highResPoster = selected.Poster !== "N/A" ? selected.Poster.replace("SX300", "SX1000") : "";

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper"
    >
      <section className="details-hero">
        <div
          className="details-backdrop"
          style={{ backgroundImage: `url(${highResPoster})` }}
        />

        <div className="details-layout">
          <div className="sidebar-poster-wrap">
            <motion.div 
              className="details-poster"
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            >
              <img src={selected.Poster !== "N/A" ? selected.Poster : "https://via.placeholder.com/400x600?text=No+Poster"} alt={selected.Title} />
            </motion.div>
            
            <motion.div 
              style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            >
              <button className="btn-primary" style={{ flex: '1 1 120px', justifyContent: 'center' }} onClick={() => {
                if (addToHistory) addToHistory(selected);
                document.getElementById('watch-player')?.scrollIntoView({ behavior: "smooth" });
              }}>
                <Play size={20} fill="currentColor" /> Watch Now
              </button>
              {trailerUrl && (
                <button className="btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center' }} onClick={() => setShowTrailer(true)}>
                  <Film size={20} /> Trailer
                </button>
              )}
              
              {/* WATCHLIST DROPDOWN */}
              <div style={{ position: 'relative', flex: '1 1 140px' }}>
                <button 
                  className={`close-search-btn ${getWatchlistStatus(selected.imdbID) !== 'none' ? 'active' : ''}`}
                  style={{ width: '100%', padding: '0 20px', height: '54px', color: getWatchlistStatus(selected.imdbID) !== 'none' ? 'var(--accent-fuchsia)' : 'white', borderRadius: '100px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowWatchlistMenu(!showWatchlistMenu)}
                >
                  {getWatchlistStatus(selected.imdbID) === 'favorite' ? <Heart size={20} fill="currentColor" /> : getWatchlistStatus(selected.imdbID) === 'completed' ? <CheckCircle size={20} /> : getWatchlistStatus(selected.imdbID) === 'watching' ? <Play size={20} fill="currentColor"/> : <BookmarkPlus size={20} />}
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {getWatchlistStatus(selected.imdbID) === 'none' ? 'Add to List' : getWatchlistStatus(selected.imdbID) === 'planToWatch' ? 'Plan to Watch' : getWatchlistStatus(selected.imdbID).charAt(0).toUpperCase() + getWatchlistStatus(selected.imdbID).slice(1)}
                  </span>
                  <ChevronDown size={16} />
                </button>
                
                <AnimatePresence>
                  {showWatchlistMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-lg)' }}
                    >
                      {[
                        { value: "none", label: "Remove from Lists", icon: <X size={16}/> },
                        { value: "favorite", label: "Favorite", icon: <Heart size={16}/> },
                        { value: "planToWatch", label: "Plan to Watch", icon: <BookmarkPlus size={16}/> },
                        { value: "watching", label: "Watching", icon: <Play size={16}/> },
                        { value: "completed", label: "Completed", icon: <CheckCircle size={16}/> }
                      ].map(opt => (
                        <button 
                          key={opt.value}
                          onClick={() => { updateWatchlist(selected, opt.value); setShowWatchlistMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {opt.icon} <span style={{ fontSize: '14px', fontWeight: '500' }}>{opt.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </div>

          <div className="main-info">
            <motion.button 
              className="search-trigger" 
              style={{ width: 'fit-content', marginBottom: '20px', border: 'none' }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Go Back
            </motion.button>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              {selected.Title}
            </motion.h1>

            <motion.div className="meta-row" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="meta-pill rating-pill">
                <Star size={16} fill="currentColor" />
                {selected.imdbRating !== "N/A" ? selected.imdbRating : "NR"}
              </div>
              <div className="meta-pill">
                <Clock size={16} /> {selected.Runtime}
              </div>
              <div className="meta-pill">
                <Calendar size={16} /> {selected.Year}
              </div>
              <div className="meta-pill">
                <Globe size={16} /> {selected.Rated !== "N/A" ? selected.Rated : "NR"}
              </div>
            </motion.div>

            <motion.div className="meta-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {selected.Genre.split(', ').map(g => (
                <span key={g} className="hero-badge">{g}</span>
              ))}
            </motion.div>

            <motion.p className="plot-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {selected.Plot}
            </motion.p>
            


            {/* Cast Rail */}
            {cast.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>Top Cast</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingBottom: '20px' }}>
                  {cast.map(actor => (
                    <Link to={`/actor/${actor.id}`} key={actor.id} className="cast-card" style={{ textDecoration: 'none' }}>
                      <img 
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://via.placeholder.com/150?text=No+Image"} 
                        alt={actor.name} 
                        className="cast-img"
                      />
                      <span className="cast-name">{actor.name}</span>
                      <span className="cast-role">{actor.character}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {providers && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>Where to Watch</h3>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <ProviderBlock title="Stream" providers={providers} type="flatrate" />
                  <ProviderBlock title="Rent" providers={providers} type="rent" />
                  <ProviderBlock title="Buy" providers={providers} type="buy" />
                </div>
              </motion.section>
            )}

          </div>
        </div>
      </section>

      {/* THEATER MODE OVERLAY */}
      <AnimatePresence>
        {theaterMode && (
          <motion.div 
            className="theater-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setTheaterMode(false)}
          />
        )}
      </AnimatePresence>

      <section id="watch-player" className="watch-section">
        <div className={`watch-premium-container ${theaterMode ? 'theater-mode-active' : ''}`}>
          
          {/* Watch Header */}
          <div className="watch-header">
            <div className="watch-header-info">
              <MonitorPlay size={24} color="var(--accent-fuchsia)" />
              <div>
                <h3>Now Playing: {selected.Title}</h3>
                <p>Select a server below if the video doesn't load</p>
              </div>
            </div>
            <button 
              className={`server-btn-premium ${theaterMode ? 'active' : ''}`} 
              style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap' }}
              onClick={() => setTheaterMode(!theaterMode)}
            >
              <Lightbulb size={18} /> {theaterMode ? 'Lights On' : 'Lights Out'}
            </button>
          </div>

          <div className="watch-layout-grid">
            {/* Player Column */}
            <div className="watch-player-col" ref={playerContainerRef}>
              <div className="video-player-container">
                <iframe
                  ref={iframeRef}
                  src={[
                    selected.Type === "series" ? `https://vidsrc.to/embed/tv/${tmdbIdState || selected.imdbID}/${season}/${episode}` : `https://vidsrc.to/embed/movie/${tmdbIdState || selected.imdbID}`,
                    selected.Type === "series" ? `https://vidsrc.pm/embed/tv/${tmdbIdState || selected.imdbID}/${season}/${episode}` : `https://vidsrc.pm/embed/movie/${tmdbIdState || selected.imdbID}`,
                    selected.Type === "series" ? `https://anyembed.xyz/embed/imdb-tv-${selected.imdbID}-${season}-${episode}` : `https://anyembed.xyz/embed/imdb-movie-${selected.imdbID}`,
                    selected.Type === "series" ? `https://vidsrc.in/embed/tv/${tmdbIdState || selected.imdbID}/${season}/${episode}` : `https://vidsrc.in/embed/movie/${tmdbIdState || selected.imdbID}`
                  ][playerIndex]}
                  key={`${selected.imdbID}-${season}-${episode}-${playerIndex}`}
                  title={`${selected.Title} player`}
                  allowFullScreen
                />
              </div>
            </div>

            {/* Controls Sidebar (desktop) / Below (mobile) */}
            <div className="watch-controls-col" ref={controlsRef}>
              {/* Server Source */}
              <div className="control-panel-section">
                <h4 className="panel-title"><Server size={18} /> Server Source</h4>
                <div className="server-controls-vertical">
                  {SERVER_OPTIONS.map((name, i) => (
                    <button key={name} className={`server-pill-btn ${playerIndex === i ? "active" : ""}`} onClick={() => setPlayerIndex(i)}>
                      <span className="server-indicator"></span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Episodes - Only for series */}
              {selected.Type === "series" && (
                <div className="control-panel-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 className="panel-title"><ListVideo size={18} /> Episodes</h4>
                    <select className="modern-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '14px' }} value={season} onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}>
                      {[...Array(parseInt(selected.totalSeasons && selected.totalSeasons !== "N/A" ? selected.totalSeasons : 1)).keys()].map(i => (
                        <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="episodes-scroll-list">
                    {loadingEpisodes ? (
                      <p style={{ color: 'var(--text-muted)' }}>Loading episodes...</p>
                    ) : episodes.length > 0 ? (
                      episodes.map(ep => {
                        const epId = `${selected.imdbID}-S${season}E${ep.Episode}`;
                        const isWatched = watchedEpisodes.includes(epId);
                        return (
                          <button 
                            key={ep.imdbID || ep.Episode} 
                            className={`episode-card-btn ${Number(ep.Episode) === episode ? 'active' : ''} ${isWatched ? 'watched' : ''}`}
                            onClick={() => {
                              setEpisode(Number(ep.Episode));
                              if (addToHistory) addToHistory(selected);
                            }}
                          >
                            <span className="ep-num">{ep.Episode}</span>
                            <div className="ep-info">
                              <span className="ep-title">{ep.Title}</span>
                              <span className="ep-rating"><Star size={12} fill="var(--accent-fuchsia)" color="var(--accent-fuchsia)"/> {ep.imdbRating !== "N/A" ? ep.imdbRating : "NR"}</span>
                            </div>
                            <div 
                              className={`ep-watched-toggle ${isWatched ? 'is-watched' : ''}`}
                              onClick={(e) => toggleWatched(epId, e)}
                            >
                              <CheckCircle size={20} />
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No episodes found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {reviews.length > 0 && (
        <section className="watch-section">
          <h3 style={{ marginBottom: '30px', fontSize: '28px' }}>Community Reviews</h3>
          <div className="reviews-masonry">
            {reviews.map((rev) => (
              <div key={rev.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">
                    {rev.author_details?.avatar_path ? (
                      <img src={rev.author_details.avatar_path.startsWith('/') ? `https://image.tmdb.org/t/p/w45${rev.author_details.avatar_path}` : rev.author_details.avatar_path.slice(1)} alt={rev.author} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{rev.author}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--accent-fuchsia)' }}>
                      <Star size={12} fill="currentColor" style={{ verticalAlign: 'middle', marginRight: 4 }}/>
                      {rev.author_details?.rating ? `${rev.author_details.rating} / 10` : 'NR'}
                    </span>
                  </div>
                </div>
                <div className="review-content">
                  <p>{rev.content.length > 300 ? rev.content.slice(0, 300) + "..." : rev.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SMART TRAILER MODAL */}
      <AnimatePresence>
        {showTrailer && trailerUrl && (
          <motion.div 
            className="theater-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 3000 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              style={{ width: '100%', maxWidth: '1000px', background: 'black', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <button 
                className="modal-close" 
                style={{ top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)' }}
                onClick={() => setShowTrailer(false)}
              >
                <X size={20} />
              </button>
              <div style={{ aspectRatio: '16/9', width: '100%' }}>
                <iframe src={trailerUrl} title={`${selected.Title} trailer`} allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {collection && collection.parts.length > 1 && (
        <section className="content-section">
          <div className="section-header">
            <div>
              <p>The Collection</p>
              <h2>{collection.name}</h2>
            </div>
          </div>
          <div className="rail-container">
            {collection.parts.map((movie, i) => (
              <MovieCard key={movie.imdbID + i} movie={movie} index={i} onToggleFav={toggleFavorite} isFav={isFavorite(movie.imdbID)} />
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <div>
              <p>You might also like</p>
              <h2>Recommendations</h2>
            </div>
          </div>
          <div className="rail-container">
            {recommendations.map((movie, i) => (
              <MovieCard key={movie.imdbID + i} movie={movie} index={i} onToggleFav={toggleFavorite} isFav={isFavorite(movie.imdbID)} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
