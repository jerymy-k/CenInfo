import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Heart, CheckCircle, Clock, Film } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

export default function ProfilePage() {
  const { user, signOut, history, favorites, watchlists } = useAuth();
  
  const [profile, setProfile] = useState({
    username: 'MovieFan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        if (data) setProfile(data);
        else setProfile(p => ({ ...p, username: user.email.split('@')[0], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id }));
      });
    } else {
      const saved = localStorage.getItem(`ceninfo_profile_guest`);
      if (saved) setProfile(JSON.parse(saved));
      else setProfile({ username: 'MovieFan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest' });
    }
  }, [user]);

  const saveProfile = async () => {
    const updated = { ...profile, username: editName || profile.username };
    setProfile(updated);
    
    if (user) {
      await supabase.from("profiles").update({ username: updated.username }).eq("id", user.id);
    } else {
      localStorage.setItem(`ceninfo_profile_guest`, JSON.stringify(updated));
    }
    
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditName(profile.username);
    setIsEditing(true);
  };

  const totalWatched = watchlists.completed.length + history.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="view-wrapper" style={{ padding: 'clamp(72px, 12vw, 120px) 5%' }}
    >
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Sidebar / Identity */}
        <div className="profile-sidebar" style={{ flex: '0 0 280px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: 'clamp(20px, 4vw, 30px)', textAlign: 'center' }}>
          <div style={{ width: 'clamp(100px, 30vw, 150px)', height: 'clamp(100px, 30vw, 150px)', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 20px', padding: '4px' }}>
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-base)' }}
            />
          </div>
          
          {isEditing ? (
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.5)', color: 'white', marginBottom: '10px' }}
              />
              <button className="btn-primary" style={{ width: '100%', padding: '10px' }} onClick={saveProfile}>Save</button>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>{profile.username}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{user ? user.email : 'Guest Mode'}</p>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 16px', fontSize: '14px', marginTop: '10px' }}
                onClick={startEdit}
              >
                Edit Profile
              </button>
            </div>
          )}

          {user && (
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255, 100, 100, 0.3)', color: '#ff6b6b', marginTop: '20px' }} 
              onClick={signOut}
            >
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>

        {/* Dashboard Stats */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '24px' }}>Your Cinematic Journey</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '16px', marginBottom: '32px' }}>
            
            <div style={{ background: 'rgba(240, 40, 122, 0.1)', border: '1px solid rgba(240, 40, 122, 0.3)', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Heart size={32} color="var(--accent-fuchsia)" />
              <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{favorites.length}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Total Favorites</span>
            </div>

            <div style={{ background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <CheckCircle size={32} color="var(--accent-violet)" />
              <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{totalWatched}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Titles Watched</span>
            </div>

            <div style={{ background: 'rgba(255, 179, 71, 0.1)', border: '1px solid rgba(255, 179, 71, 0.3)', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Clock size={32} color="var(--accent-amber)" />
              <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{watchlists.planToWatch.length}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Plan to Watch</span>
            </div>

          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Film size={20} /> Watch History (Last 50)</h3>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {history.map(movie => (
                  <div key={`hist-${movie.imdbID}`} style={{ display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px', alignItems: 'center' }}>
                    <img src={movie.Poster} alt={movie.Title} style={{ width: '40px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0' }}>{movie.Title}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{movie.Year} • {movie.Type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>You haven't watched anything recently.</p>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
