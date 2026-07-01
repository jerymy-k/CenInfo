import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Heart, CheckCircle, Clock, Film, Lock, Users, Bell, Check, X, Shield, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { supabase } from "../supabase";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { history, favorites, watchlists } = useLibrary();
  
  const [profile, setProfile] = useState({
    username: 'MovieFan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    library_privacy: 'private'
  });

  const [activeTab, setActiveTab] = useState('overview'); // overview, social, settings
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  // Social State
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setProfile(JSON.parse(saved));
      else setProfile({ username: 'MovieFan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest', library_privacy: 'private' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { error } = await supabase.from("profiles").update({ library_privacy: level }).eq("id", user.id);
      if (error) {
        console.error("Failed to save privacy setting:", error);
        alert(`Failed to save privacy setting: ${error.message}. Please verify your database has a 'library_privacy' column and RLS policies allow updates.`);
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError(false);
    
    if (!currentPassword) {
      setPasswordError(true);
      setPasswordMessage('Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(true);
      setPasswordMessage('New password must be at least 6 characters.');
      return;
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (verifyError) {
      setPasswordError(true);
      setPasswordMessage('Incorrect current password.');
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(true);
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage('Password updated successfully!');
      setCurrentPassword('');
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
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Film color="var(--accent-fuchsia)" /> Your Cinematic Journey
              </h2>
              
              {/* Premium Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(240,40,122,0.1), transparent)', borderTop: '2px solid var(--accent-fuchsia)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Heart size={120} /></div>
                  <Heart size={32} color="var(--accent-fuchsia)" />
                  <span style={{ fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: '900', lineHeight: 1, textShadow: '0 4px 12px rgba(240,40,122,0.3)' }}>{favorites.length}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>Total Favorites</span>
                </div>

                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(138,43,226,0.1), transparent)', borderTop: '2px solid var(--accent-violet)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><CheckCircle size={120} /></div>
                  <CheckCircle size={32} color="var(--accent-violet)" />
                  <span style={{ fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: '900', lineHeight: 1, textShadow: '0 4px 12px rgba(138,43,226,0.3)' }}>{totalWatched}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>Titles Watched</span>
                </div>

                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(255,179,71,0.1), transparent)', borderTop: '2px solid var(--accent-amber)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Clock size={120} /></div>
                  <Clock size={32} color="var(--accent-amber)" />
                  <span style={{ fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: '900', lineHeight: 1, textShadow: '0 4px 12px rgba(255,179,71,0.3)' }}>{watchlists.planToWatch?.length || 0}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>Plan to Watch</span>
                </div>
              </div>

              {/* Currently Watching Hero (if any) */}
              {watchlists.watching?.length > 0 && (
                <div className="glass-panel" style={{ padding: '0', marginBottom: '32px', display: 'flex', overflow: 'hidden', position: 'relative', minHeight: '200px' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${watchlists.watching[0].Poster})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.3)', zIndex: 0 }}></div>
                  <div style={{ position: 'relative', zIndex: 1, padding: '30px', display: 'flex', gap: '24px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <img src={watchlists.watching[0].Poster} alt="Poster" style={{ width: '100px', height: '150px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="nav-badge" style={{ background: 'var(--accent-violet)', marginBottom: '12px', display: 'inline-block' }}>Currently Watching</span>
                      <h3 style={{ fontSize: '28px', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{watchlists.watching[0].Title}</h3>
                      <Link to={`/movie/${watchlists.watching[0].imdbID}`} className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px', marginTop: '12px', display: 'inline-block', textDecoration: 'none' }}>Continue Watching</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Watch History Horizontal Carousel */}
              <div className="glass-panel" style={{ padding: '30px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}><Clock size={20} color="var(--accent-fuchsia)" /> Recent Activity</h3>
                  <Link to="/library" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>View Full Library →</Link>
                </div>
                
                {history.length > 0 ? (
                  <div className="custom-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', scrollSnapType: 'x mandatory' }}>
                    {history.slice(0, 10).map(movie => (
                      <Link key={`hist-${movie.imdbID}`} to={`/movie/${movie.imdbID}`} style={{ flexShrink: 0, width: '140px', scrollSnapAlign: 'start', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ width: '140px', height: '210px', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginBottom: '12px', position: 'relative' }}>
                          <img src={movie.Poster} alt={movie.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: '12px', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                             <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>View Details</span>
                          </div>
                        </div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.Title}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{movie.Year}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: 0 }}>You haven't watched anything recently. Time to discover some movies!</p>
                  </div>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: '600' }}>Account Settings</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Manage your preferences and security details.</p>
              </div>
              
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '24px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>Library Visibility</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Control who can see your Watchlists and Favorites.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                  {[
                    { id: 'private', label: 'Private', desc: 'Only you can see your library.', icon: <Lock size={16}/> },
                    { id: 'friends', label: 'Friends Only', desc: 'Only approved connections can view.', icon: <Users size={16}/> },
                    { id: 'public', label: 'Public', desc: 'Anyone can see your library.', icon: <Globe size={16}/> }
                  ].map(option => (
                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: profile.library_privacy === option.id ? '1px solid white' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: profile.library_privacy === option.id ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input 
                        type="radio" 
                        name="privacy" 
                        value={option.id} 
                        checked={profile.library_privacy === option.id}
                        onChange={() => savePrivacy(option.id)}
                        style={{ margin: 0, width: '16px', height: '16px', accentColor: 'white' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', color: profile.library_privacy === option.id ? 'white' : 'var(--text-secondary)' }}>
                           {option.icon} {option.label}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>Change Password</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontSize: '14px', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={e => e.target.style.border = '1px solid rgba(255,255,255,0.4)'}
                      onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontSize: '14px', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={e => e.target.style.border = '1px solid rgba(255,255,255,0.4)'}
                      onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                    />
                  </div>
                  <button type="submit" style={{ padding: '12px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', background: 'white', color: 'black', border: 'none', cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = '0.9'} onMouseLeave={e => e.target.style.opacity = '1'}>
                    Update Password
                  </button>
                  
                  {passwordMessage && (
                    <div style={{ padding: '12px', borderRadius: '6px', border: passwordError ? '1px solid rgba(255,0,0,0.3)' : '1px solid rgba(0,255,0,0.3)', background: passwordError ? 'rgba(255,0,0,0.05)' : 'rgba(0,255,0,0.05)', fontSize: '13px', color: passwordError ? '#ff4d4d' : '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {passwordError ? <X size={14}/> : <CheckCircle size={14}/>} {passwordMessage}
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
