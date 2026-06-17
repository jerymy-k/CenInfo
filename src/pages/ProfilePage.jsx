import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Heart, CheckCircle, Clock, Film, Lock, Users, Bell, Check, X, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

export default function ProfilePage() {
  const { user, signOut, history, favorites, watchlists } = useAuth();
  
  const [profile, setProfile] = useState({
    username: 'MovieFan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    library_privacy: 'public'
  });

  const [activeTab, setActiveTab] = useState('overview'); // overview, social, settings
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  // Social State
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Settings State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data);
          setEditName(data.username);
        } else {
          setProfile(p => ({ ...p, username: user.email.split('@')[0], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id }));
        }
      });
      loadSocialData();
    } else {
      const saved = localStorage.getItem(`ceninfo_profile_guest`);
      if (saved) setProfile(JSON.parse(saved));
      else setProfile({ username: 'MovieFan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest', library_privacy: 'public' });
    }
  }, [user]);

  async function loadSocialData() {
    if (!user) return;
    
    // Fetch pending requests
    const { data: pendingData } = await supabase.from('friendships').select('*').eq('receiver_id', user.id).eq('status', 'pending');
    if (pendingData && pendingData.length > 0) {
      const requesterIds = pendingData.map(r => r.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', requesterIds);
      const enriched = pendingData.map(req => ({
        ...req,
        profile: profiles?.find(p => p.id === req.requester_id) || { id: req.requester_id, username: 'Someone', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester_id}` }
      }));
      setIncomingRequests(enriched);
    } else {
      setIncomingRequests([]);
    }

    // Fetch friends
    const { data: friendsData } = await supabase.from('friendships').select('*').eq('status', 'accepted').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (friendsData && friendsData.length > 0) {
      const friendIds = friendsData.map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds);
      const enrichedFriends = friendsData.map(f => {
        const friendId = f.requester_id === user.id ? f.receiver_id : f.requester_id;
        return {
          ...f,
          profile: profiles?.find(p => p.id === friendId) || { id: friendId, username: 'Someone', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId}` }
        };
      });
      setFriends(enrichedFriends);
    } else {
      setFriends([]);
    }
  }

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

  const savePrivacy = async (level) => {
    const updated = { ...profile, library_privacy: level };
    setProfile(updated);
    if (user) {
      await supabase.from("profiles").update({ library_privacy: level }).eq("id", user.id);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMessage(error.message);
    else {
      setPasswordMessage('Password updated successfully!');
      setNewPassword('');
    }
  };

  async function handleRequest(requestId, action) {
    if (action === 'accept') {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    } else {
      await supabase.from('friendships').delete().eq('id', requestId);
    }
    loadSocialData();
  }

  const totalWatched = watchlists.completed.length + history.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="view-wrapper" style={{ padding: 'clamp(72px, 12vw, 120px) 5%' }}>
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Sidebar / Identity */}
        <div className="profile-sidebar" style={{ flex: '0 0 280px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: 'clamp(20px, 4vw, 30px)', textAlign: 'center' }}>
            <div style={{ width: 'clamp(100px, 30vw, 150px)', height: 'clamp(100px, 30vw, 150px)', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 20px', padding: '4px' }}>
              <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-base)' }} />
            </div>
            
            {isEditing ? (
              <div style={{ marginBottom: '20px' }}>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.5)', color: 'white', marginBottom: '10px' }} />
                <button className="btn-primary" style={{ width: '100%', padding: '10px' }} onClick={saveProfile}>Save</button>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>{profile.username}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{user ? user.email : 'Guest Mode'}</p>
                <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '14px', marginTop: '10px' }} onClick={() => setIsEditing(true)}>Edit Profile</button>
              </div>
            )}

            {user && (
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255, 100, 100, 0.3)', color: '#ff6b6b', marginTop: '20px' }} onClick={signOut}>
                <LogOut size={16} /> Sign Out
              </button>
            )}
          </div>
          
          {/* Nav Tabs */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setActiveTab('overview')} className={`filter-btn ${activeTab === 'overview' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%', padding: '12px 20px' }}>
              <Film size={18} style={{ marginRight: '10px' }}/> Overview
            </button>
            <button onClick={() => setActiveTab('social')} className={`filter-btn ${activeTab === 'social' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center' }}>
              <Users size={18} style={{ marginRight: '10px' }}/> Social Network
              {incomingRequests.length > 0 && <span className="nav-badge" style={{ marginLeft: 'auto' }}>{incomingRequests.length}</span>}
            </button>
            <button onClick={() => setActiveTab('settings')} className={`filter-btn ${activeTab === 'settings' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%', padding: '12px 20px' }}>
              <Shield size={18} style={{ marginRight: '10px' }}/> Account & Privacy
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '24px' }}>Your Cinematic Journey</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid var(--accent-fuchsia)' }}>
                  <Heart size={32} color="var(--accent-fuchsia)" />
                  <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{favorites.length}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Favorites</span>
                </div>
                <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid var(--accent-violet)' }}>
                  <CheckCircle size={32} color="var(--accent-violet)" />
                  <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{totalWatched}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Titles Watched</span>
                </div>
                <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid var(--accent-amber)' }}>
                  <Clock size={32} color="var(--accent-amber)" />
                  <span style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '800' }}>{watchlists.planToWatch.length}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Plan to Watch</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Film size={20} /> Watch History</h3>
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
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '24px' }}>Social Network</h2>
              
              <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Bell size={20} color="var(--accent-fuchsia)" /> Incoming Requests</h3>
                {incomingRequests.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {incomingRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>
                        <Link to={`/user/${req.profile.id}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                          <img src={req.profile.avatar} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{req.profile.username}</p>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Wants to be friends</p>
                          </div>
                        </Link>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRequest(req.id, 'accept')} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16}/> Accept</button>
                          <button onClick={() => handleRequest(req.id, 'decline')} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}><X size={16}/> Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No pending friend requests.</p>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="var(--accent-violet)" /> My Friends</h3>
                {friends.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {friends.map(friend => (
                      <Link key={friend.id} to={`/user/${friend.profile.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}>
                          <img src={friend.profile.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{friend.profile.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>You haven't added any friends yet. Check out movie reviews to find people with similar taste!</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '24px' }}>Account & Privacy</h2>
              
              <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={20} color="var(--accent-amber)" /> Library Privacy</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Who can see your Watchlists and Favorites on your public profile?</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => savePrivacy('public')} 
                    className={`filter-btn ${profile.library_privacy === 'public' ? 'active' : ''}`}
                  >🌎 Public (Everyone)</button>
                  <button 
                    onClick={() => savePrivacy('friends')} 
                    className={`filter-btn ${profile.library_privacy === 'friends' ? 'active' : ''}`}
                  >👥 Friends Only</button>
                  <button 
                    onClick={() => savePrivacy('private')} 
                    className={`filter-btn ${profile.library_privacy === 'private' ? 'active' : ''}`}
                  >🔒 Private (Only Me)</button>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={20} color="var(--text-primary)" /> Change Password</h3>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  <input 
                    type="password" 
                    placeholder="New Password (min. 6 characters)" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                  />
                  <button type="submit" className="btn-primary">Update Password</button>
                  {passwordMessage && <p style={{ margin: 0, color: passwordMessage.includes('success') ? '#4ade80' : '#ff6b6b' }}>{passwordMessage}</p>}
                </form>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
