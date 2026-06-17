import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Clock, Play, CheckCircle, Search, BookmarkPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import { supabase } from "../supabase";

export default function Library() {
  const { favorites, watchlists, toggleFavorite, isFavorite, createList, deleteList, user } = useAuth();
  
  const tabs = [
    { id: 'favorite', label: 'Favorites', icon: <Heart size={16} /> },
    { id: 'planToWatch', label: 'Plan to Watch', icon: <BookmarkPlus size={16} /> },
    { id: 'watching', label: 'Watching', icon: <Play size={16} /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle size={16} /> },
    ...Object.keys(watchlists)
      .filter(key => !['planToWatch', 'watching', 'completed'].includes(key))
      .map(key => ({ id: key, label: key, icon: <BookmarkPlus size={16} /> }))
  ];

  const [activeTab, setActiveTab] = useState('favorite');
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [copied, setCopied] = useState(false);

  const getActiveList = () => {
    if (activeTab === 'favorite') return favorites;
    return watchlists[activeTab] || [];
  };

  const handleShare = () => {
    if (!user) return;
    const url = `${window.location.origin}/list/${user.id}/${activeTab}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div key={tab.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button
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
            {!['favorite', 'planToWatch', 'watching', 'completed'].includes(tab.id) && (
              <button 
                onClick={() => {
                  deleteList(tab.id);
                  if (activeTab === tab.id) setActiveTab('favorite');
                }}
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0 10px' }}
                title="Delete List"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {isCreatingList ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            createList(newListName);
            setActiveTab(newListName);
            setNewListName('');
            setIsCreatingList(false);
          }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              autoFocus
              type="text" 
              value={newListName} 
              onChange={e => setNewListName(e.target.value)}
              placeholder="List name..."
              style={{ padding: '10px 16px', borderRadius: '100px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>Add</button>
          </form>
        ) : (
          <button onClick={() => setIsCreatingList(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '100px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}>+ New List</button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>{activeTab === 'favorite' ? 'Favorites' : activeTab}</h3>
        {activeTab !== 'favorite' && (
          <button onClick={handleShare} className="btn-secondary">
            {copied ? 'Copied!' : 'Share List'}
          </button>
        )}
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
