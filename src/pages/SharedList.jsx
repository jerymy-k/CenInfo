import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { supabase } from "../supabase";

export default function SharedList() {
  const { userId, listName } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerEmail] = useState("A User");

  useEffect(() => {
    async function loadSharedList() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("watchlists")
          .select("*")
          .eq("user_id", userId)
          .eq("list_type", listName);
          
        if (error) throw error;
        
        if (data) {
          setMovies(data.map(row => row.movie_data));
        }

        // Optional: fetch user info if public, though Supabase users table isn't public by default
        // We'll just say "A User" for now.
      } catch (err) {
        console.error(err);
        setError("Failed to load list. It might be private or deleted.");
      }
      setLoading(false);
    }
    
    if (userId && listName) {
      loadSharedList();
    }
  }, [userId, listName]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper" style={{ padding: 'clamp(72px, 12vw, 120px) 5%' }}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 7vw, 48px)', marginBottom: '16px' }}>
          {listName === 'planToWatch' ? 'Plan to Watch' : listName === 'watching' ? 'Watching' : listName === 'completed' ? 'Completed' : listName}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>
          A shared collection by {ownerEmail}.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading collection...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
          <Search size={48} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
          <h3>This list is empty</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: '16px' }}>
          {movies.map((movie, i) => (
            <motion.div
              key={movie.imdbID + i}
              className="movie-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -8 }}
            >
              <Link to={`/movie/${movie.imdbID}`} style={{ display: 'block' }}>
                <div className="poster-wrapper">
                  <img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.Title} className="poster-img" loading="lazy" />
                  <div className="card-overlay">
                    <h5 className="card-title" title={movie.Title}>{movie.Title}</h5>
                    <div className="card-info">
                      <span>{movie.Year || "Unknown"}</span>
                      <span className="hero-badge" style={{ fontSize: '10px' }}>{movie.Type || "movie"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
