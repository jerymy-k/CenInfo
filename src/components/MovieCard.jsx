import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function MovieCard({ movie, isFav, onToggleFav, index = 0 }) {
  const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";

  return (
    <motion.article 
      className="movie-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -8 }}
    >
      <Link to={`/movie/${movie.imdbID}`} style={{ display: 'block' }}>
        <div className="poster-wrapper">
          <img src={poster} alt={movie.Title} className="poster-img" loading="lazy" />
          <div className="card-overlay">
            <h5 className="card-title" title={movie.Title}>{movie.Title}</h5>
            <div className="card-info">
              <span>{movie.Year || "Unknown"}</span>
              <span className="hero-badge" style={{ fontSize: '10px' }}>{movie.Type || "movie"}</span>
            </div>
          </div>
          
          <button
            className={`fav-btn ${isFav ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav(movie);
            }}
            aria-label="Save to library"
          >
            <Heart size={18} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </Link>
    </motion.article>
  );
}
