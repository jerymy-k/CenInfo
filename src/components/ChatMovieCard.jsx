import { Link } from "react-router-dom";
import { Star, Calendar } from "lucide-react";

export default function ChatMovieCard({ movie }) {
  if (!movie) return null;

  // Sometimes the ID is just the TMDB ID, but our routes handle 'tmdb-movie-123' properly if passed down.
  // The fetchLiveSearch returns imdbID as "tmdb-movie-id" or "tmdb-tv-id" which works with MovieDetails.
  
  return (
    <Link to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
      <div 
        style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '8px',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'var(--accent-fuchsia)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ width: '70px', height: '105px', flexShrink: 0, background: '#111' }}>
          <img 
            src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/70x105?text=No+Poster'} 
            alt={movie.Title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            loading="lazy"
          />
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {movie.Title}
          </h4>
          <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {movie.Year}
            </span>
            {movie.imdbRating && movie.imdbRating !== "N/A" && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-fuchsia)' }}>
                <Star size={14} fill="currentColor" /> {movie.imdbRating}
              </span>
            )}
          </div>
          <span style={{ marginTop: '8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {movie.Type === "series" || movie.Type === "tv" ? "TV Series" : "Movie"}
          </span>
        </div>
      </div>
    </Link>
  );
}
