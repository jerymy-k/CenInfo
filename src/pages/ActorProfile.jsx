import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, CalendarDays, UserRound } from "lucide-react";
import { fetchActorDetails } from "../services/api";
import MovieCard from "../components/MovieCard";
import { useAuth } from "../context/AuthContext";

export default function ActorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useAuth();
  
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActor() {
      setLoading(true);
      setError("");
      const data = await fetchActorDetails(id);
      if (!data) {
        setError("Actor details could not be loaded.");
      } else {
        setActor(data);
      }
      setLoading(false);
    }
    loadActor();
  }, [id]);

  if (loading) return <div style={{ height: '100vh', background: 'var(--bg-base)' }}></div>;

  if (error || !actor) {
    return (
      <div className="view-wrapper" style={{ padding: '120px 5%' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 style={{ marginTop: '20px' }}>{error}</h2>
      </div>
    );
  }

  const profileImageUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : "https://via.placeholder.com/500x750?text=No+Photo";

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper" style={{ padding: '120px 5%' }}
    >
      <button className="search-trigger" style={{ width: 'fit-content', marginBottom: '20px', border: 'none' }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Go Back
      </button>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '60px' }}>
        <div style={{ flex: '0 0 300px' }}>
          <img 
            src={profileImageUrl} 
            alt={actor.name} 
            style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }} 
          />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>{actor.name}</h1>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {actor.known_for_department && (
              <span className="meta-pill"><UserRound size={16}/> {actor.known_for_department}</span>
            )}
            {actor.birthday && (
              <span className="meta-pill"><CalendarDays size={16}/> {actor.birthday}</span>
            )}
            {actor.place_of_birth && (
              <span className="meta-pill"><MapPin size={16}/> {actor.place_of_birth}</span>
            )}
          </div>
          
          <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Biography</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-line' }}>
            {actor.biography || "No biography available for this actor."}
          </p>
        </div>
      </div>

      <section>
        <div className="section-header">
          <div>
            <p>Known For</p>
            <h2>Filmography</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {actor.credits.map((movie, i) => (
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

    </motion.div>
  );
}
