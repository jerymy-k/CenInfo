import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Heart, MessageSquare, ArrowLeft, UserPlus, UserCheck, Clock, ShieldAlert, Film } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuth } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs & Privacy
  const [activeTab, setActiveTab] = useState('activity');
  const [canViewLibrary, setCanViewLibrary] = useState(false);
  
  // Data
  const [recentReviews, setRecentReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchlists, setWatchlists] = useState({ planToWatch: [], watching: [], completed: [] });
  
  // Friend stats
  const [friendsCount, setFriendsCount] = useState(0);
  const [friendStatus, setFriendStatus] = useState('none'); // none, pending_sent, pending_received, friends

  useEffect(() => {
    async function loadProfileData() {
      // If user tries to view their own public profile, redirect to the personal dashboard
      if (user && user.id === userId) {
        navigate("/profile");
        return;
      }
      
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (profileData) setProfile(profileData);

      // 2. Fetch Friend Stats
      let currentFriendStatus = 'none';
      const { data: friendshipsData } = await supabase.from("friendships").select("status, requester_id, receiver_id").or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
      
      if (friendshipsData) {
        const acceptedCount = friendshipsData.filter(f => f.status === 'accepted').length;
        setFriendsCount(acceptedCount);

        if (user) {
          const relationship = friendshipsData.find(f => (f.requester_id === user.id && f.receiver_id === userId) || (f.requester_id === userId && f.receiver_id === user.id));
          if (relationship) {
            if (relationship.status === 'accepted') currentFriendStatus = 'friends';
            else if (relationship.requester_id === user.id) currentFriendStatus = 'pending_sent';
            else currentFriendStatus = 'pending_received';
          }
          setFriendStatus(currentFriendStatus);
        }
      }

      // 3. Privacy Logic
      const privacy = profileData?.library_privacy || 'public';
      const isAllowed = privacy === 'public' || 
                        (privacy === 'friends' && currentFriendStatus === 'friends') || 
                        (user && user.id === userId);
      setCanViewLibrary(isAllowed);

      // 4. Fetch Data
      const { data: reviewsData } = await supabase.from("user_reviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
      if (reviewsData) setRecentReviews(reviewsData);

      if (isAllowed) {
        const { data: favs } = await supabase.from("favorites").select("*").eq("user_id", userId);
        if (favs) setFavorites(favs.map(f => ({ imdbID: f.imdb_id, Poster: f.poster, Title: f.title })));

        const { data: lists } = await supabase.from("watchlists").select("*").eq("user_id", userId);
        if (lists) {
          const newLists = { planToWatch: [], watching: [], completed: [] };
          lists.forEach(row => {
            if (!newLists[row.list_type]) newLists[row.list_type] = [];
            newLists[row.list_type].push(row.movie_data);
          });
          setWatchlists(newLists);
        }
      }

      setLoading(false);
    }
    
    if (userId) loadProfileData();
  }, [userId, user]);

  const handleFriendAction = async (action) => {
    if (!user) { setShowAuth(true); return; }
    if (user.id === userId) return;

    if (action === 'add') {
      setFriendStatus('pending_sent');
      await supabase.from("friendships").insert({ requester_id: user.id, receiver_id: userId, status: 'pending' });
    } else if (action === 'accept') {
      setFriendStatus('friends');
      setFriendsCount(prev => prev + 1);
      await supabase.from("friendships").update({ status: 'accepted' }).eq('requester_id', userId).eq('receiver_id', user.id);
      // Reload page to unlock library
      window.location.reload();
    } else if (action === 'remove' || action === 'cancel') {
      if (friendStatus === 'friends') setFriendsCount(prev => prev - 1);
      setFriendStatus('none');
      await supabase.from("friendships").delete().or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`);
      if (action === 'remove') window.location.reload(); // Re-lock library if needed
    }
  };

  if (loading) return <div style={{ height: '100vh', background: 'var(--bg-base)' }}></div>;

  if (!profile) {
    return (
      <div className="view-wrapper" style={{ padding: 'clamp(72px, 12vw, 120px) 5%', textAlign: 'center' }}>
        <h2>User Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>This profile does not exist or is private.</p>
        <button className="btn-secondary" style={{ margin: '20px auto' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Go Back
        </button>
      </div>
    );
  }

  const renderLockedState = () => (
    <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', marginTop: '40px' }}>
      <ShieldAlert size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px' }} />
      <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Private Library</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '18px', margin: 0, maxWidth: '500px', margin: '0 auto' }}>
        {profile.username} has chosen to keep their cinematic library private.
        {profile.library_privacy === 'friends' && " You must be friends to view this content."}
      </p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="view-wrapper" style={{ paddingBottom: '100px' }}>
      
      {/* Cinematic Header */}
      <div style={{ height: '350px', width: '100%', background: 'var(--gradient-primary)', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)' }} />
         <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', position: 'relative', top: '-100px', zIndex: 10 }}>
        
        {/* Profile Identity & Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-end', marginBottom: '40px' }}>
          
          <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--bg-base)', padding: '8px', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
            <img src={profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId} alt={profile.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          
          <div style={{ flex: 1, paddingBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '48px', margin: '0 0 12px 0', lineHeight: '1' }}>{profile.username}</h1>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}><strong style={{ color: 'white', fontWeight: 800 }}>{friendsCount}</strong> Friends</span>
              </div>
            </div>
            
            {(!user || user.id !== userId) && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {friendStatus === 'none' && (
                  <button className="btn-primary" onClick={() => handleFriendAction('add')} style={{ padding: '12px 32px', fontSize: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <UserPlus size={20} /> Add Friend
                  </button>
                )}
                {friendStatus === 'pending_sent' && (
                  <button className="btn-secondary" onClick={() => handleFriendAction('cancel')} style={{ padding: '12px 32px', fontSize: '16px', display: 'flex', gap: '10px', alignItems: 'center', opacity: 0.8 }}>
                    <Clock size={20} /> Request Sent
                  </button>
                )}
                {friendStatus === 'pending_received' && (
                  <button className="btn-primary" onClick={() => handleFriendAction('accept')} style={{ padding: '12px 32px', fontSize: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <UserCheck size={20} /> Accept Request
                  </button>
                )}
                {friendStatus === 'friends' && (
                  <button className="btn-secondary" onClick={() => handleFriendAction('remove')} style={{ padding: '12px 32px', fontSize: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <UserCheck size={20} /> Friends
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '40px', overflowX: 'auto' }} className="custom-scroll">
          <button onClick={() => setActiveTab('activity')} style={{ background: 'transparent', border: 'none', color: activeTab === 'activity' ? 'white' : 'var(--text-muted)', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20}/> Activity</span>
            {activeTab === 'activity' && <motion.div layoutId="activetab" style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '3px', background: 'var(--accent-fuchsia)', borderRadius: '3px' }} />}
          </button>
          <button onClick={() => setActiveTab('favorites')} style={{ background: 'transparent', border: 'none', color: activeTab === 'favorites' ? 'white' : 'var(--text-muted)', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={20}/> Favorites</span>
            {activeTab === 'favorites' && <motion.div layoutId="activetab" style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '3px', background: 'var(--accent-fuchsia)', borderRadius: '3px' }} />}
          </button>
          <button onClick={() => setActiveTab('watchlists')} style={{ background: 'transparent', border: 'none', color: activeTab === 'watchlists' ? 'white' : 'var(--text-muted)', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Film size={20}/> Watchlists</span>
            {activeTab === 'watchlists' && <motion.div layoutId="activetab" style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '3px', background: 'var(--accent-fuchsia)', borderRadius: '3px' }} />}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          
          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {recentReviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
                  {recentReviews.map(review => (
                    <div key={review.id} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-fuchsia)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to={`/movie/${review.imdb_id}`} style={{ color: 'white', textDecoration: 'none', fontWeight: '800', fontSize: '20px' }} className="text-gradient">
                          Reviewed a Movie
                        </Link>
                        {review.rating && (
                          <span className="nav-badge" style={{ fontSize: '16px', padding: '6px 16px' }}>{review.rating} / 10</span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px', lineHeight: '1.6' }}>"{review.content}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '20px', margin: 0 }}>This user hasn't posted any public reviews yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <motion.div key="favorites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {!canViewLibrary ? renderLockedState() : (
                favorites.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    {favorites.map(movie => (
                      <Link key={`fav-${movie.imdbID}`} to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
                        <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                          <img src={movie.Poster} alt={movie.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', alignItems: 'flex-end', padding: '12px' }}>
                            <h4 style={{ color: 'white', margin: 0, fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{movie.Title}</h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Their favorites list is empty.</p>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* WATCHLISTS TAB */}
          {activeTab === 'watchlists' && (
            <motion.div key="watchlists" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {!canViewLibrary ? renderLockedState() : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* Currently Watching */}
                  <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Currently Watching</h3>
                    {watchlists.watching.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                        {watchlists.watching.map(movie => (
                          <Link key={`w-${movie.imdbID}`} to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
                            <img src={movie.Poster} alt={movie.Title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px' }} />
                          </Link>
                        ))}
                      </div>
                    ) : <p style={{ color: 'var(--text-muted)' }}>Not currently watching anything.</p>}
                  </div>

                  {/* Plan to Watch */}
                  <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Plan to Watch</h3>
                    {watchlists.planToWatch.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                        {watchlists.planToWatch.map(movie => (
                          <Link key={`p-${movie.imdbID}`} to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
                            <img src={movie.Poster} alt={movie.Title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px' }} />
                          </Link>
                        ))}
                      </div>
                    ) : <p style={{ color: 'var(--text-muted)' }}>No movies planned yet.</p>}
                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
