import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal } from "lucide-react";
import { fetchAdvancedDiscover } from "../services/api";
import MovieCard from "../components/MovieCard";
import { useAuth } from "../context/AuthContext";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

export default function Discover() {
  const { toggleFavorite, isFavorite } = useAuth();
  
  const [type, setType] = useState("movie");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("6");
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadDiscover(pageNum = 1) {
    setLoading(true);
    const { results: newResults, totalPages: newTotal } = await fetchAdvancedDiscover(type, genre, year, minRating, pageNum);
    
    if (pageNum === 1) {
      setResults(newResults);
    } else {
      setResults(prev => [...prev, ...newResults]);
    }
    
    setTotalPages(newTotal);
    setPage(pageNum);
    setLoading(false);
  }

  useEffect(() => {
    loadDiscover(1);
  }, [type, genre, year, minRating]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper" style={{ padding: '120px 5%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--gradient-primary)', padding: '12px', borderRadius: '16px' }}>
          <SlidersHorizontal size={32} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '36px', margin: 0 }}>Advanced Discover</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Find exactly what you're looking for.</p>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border-light)', 
        borderRadius: '24px', 
        padding: '24px',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Media Type</label>
          <select className="modern-select" style={{ width: '100%' }} value={type} onChange={e => setType(e.target.value)}>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Genre</label>
          <select className="modern-select" style={{ width: '100%' }} value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="">Any Genre</option>
            {GENRES.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Release Year</label>
          <select className="modern-select" style={{ width: '100%' }} value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Any Year</option>
            {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Min Rating (TMDB)</label>
          <select className="modern-select" style={{ width: '100%' }} value={minRating} onChange={e => setMinRating(e.target.value)}>
            <option value="">Any Rating</option>
            {[9, 8, 7, 6, 5, 4].map(r => (
              <option key={r} value={r}>{r}.0+</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading results...</p>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Filter size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3>No results found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters to find more titles.</p>
        </div>
      )}

      {!loading && page < totalPages && results.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button className="btn-secondary" onClick={() => loadDiscover(page + 1)}>
            Load More Matches
          </button>
        </div>
      )}

    </motion.div>
  );
}
