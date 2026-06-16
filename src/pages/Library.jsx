import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Clock, Play, CheckCircle, Search, BookmarkPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";

export default function Library() {
  const { favorites, watchlists, toggleFavorite, isFavorite } = useAuth();
  
  const tabs = [
    { id: 'favorite', label: 'Favorites', icon: <Heart size={16} /> },
    { id: 'planToWatch', label: 'Plan to Watch', icon: <BookmarkPlus size={16} /> },
    { id: 'watching', label: 'Watching', icon: <Play size={16} /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle size={16} /> }
  ];

  const [activeTab, setActiveTab] = useState('favorite');

  const getActiveList = () => {
    if (activeTab === 'favorite') return favorites;
    return watchlists[activeTab] || [];
  };

  const activeList = getActiveList();

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper" style={{ padding: 'clamp(72px, 12vw, 120px) 5%' }}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 7vw, 48px)', marginBottom: '16px' }}>My Library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Manage your movie collections and track your progress.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none', borderBottom: '1px solid var(--border-light)', marginBottom: '40px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: activeTab === tab.id ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '100px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
          <Search size={48} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
          <h3>This list is empty</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Explore the catalog and add movies to your <strong>{tabs.find(t => t.id === activeTab).label}</strong> list to keep track of them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: '16px' }}>
          {activeList.map((movie, i) => (
            <MovieCard
              key={movie.imdbID + i}
              movie={movie}
              index={i}
              onToggleFav={toggleFavorite}
              isFav={isFavorite(movie.imdbID)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
