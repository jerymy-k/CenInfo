import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users, PlayCircle, MessageSquare, Send, X, ArrowLeft, Maximize, Minimize } from "lucide-react";
import { fetchMovieDetails } from "../services/api";

// Pre-load the notification sound
const notificationAudio = new Audio('/sounds/notification.mp3');
notificationAudio.volume = 0.8;
let audioUnlocked = false;

// Browsers block audio until user interacts with page. Unlock on first click.
const unlockAudio = () => {
  if (!audioUnlocked) {
    notificationAudio.play().then(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      audioUnlocked = true;
    }).catch(() => {});
  }
};
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

const playPing = () => {
  try {
    const sound = notificationAudio.cloneNode();
    sound.volume = 0.8;
    sound.play().catch(() => {});
  } catch {
    // Audio blocked or unsupported
  }
};

export default function WatchParty() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Core State ---
  const [movie, setMovie] = useState(null);
  const [tmdbId, setTmdbId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  // --- Player ---
  const SERVER_NAMES = ["VidSrc", "Embed.su", "VidSrc.cc", "VidSrc.net", "VidLink", "MultiEmbed"];
  const [playerIndex, setPlayerIndex] = useState(0);

  // --- Fullscreen (CSS-based, NOT Fullscreen API) ---
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // --- Toast / Reply ---
  const [chatToast, setChatToast] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // --- Refs ---
  const channelRef = useRef(null);
  const chatEndRef = useRef(null);
  const toastTimerRef = useRef(null);
  const replyInputRef = useRef(null);
  const unreadCountRef = useRef(0);
  const originalTitle = useRef('CenInfo');

  // Extract IMDB ID from roomId (format: imdbID-randomUUID)
  const imdbID = roomId.split('-')[0];

  // ============================================================
  //  EFFECT: Load movie + set up Supabase Realtime channel
  // ============================================================
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    // --- Load movie details ---
    const loadMovie = async () => {
      try {
        const { data, error: apiError, tmdbId: tId } = await fetchMovieDetails(imdbID);
        if (data && data.Response !== "False") {
          setMovie(data);
          setTmdbId(tId);
        } else {
          setError(apiError || "Movie not found.");
        }
      } catch {
        setError("Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };
    loadMovie();

    // --- Request Notification permission ---
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // --- Reset unread count when tab gets focus ---
    const origTitle = originalTitle.current;
    const handleFocus = () => {
      unreadCountRef.current = 0;
      document.title = originalTitle.current;
    };
    window.addEventListener('focus', handleFocus);

    // --- Supabase Realtime channel ---
    const channel = supabase.channel(`watch_party_${roomId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = [];
        let anyStarted = false;
        for (const id in state) {
          if (state[id]?.[0]) {
            users.push(state[id][0]);
            if (state[id][0].is_started) anyStarted = true;
          }
        }
        setParticipants(users);
        if (anyStarted) setIsStarted(true);
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        const msg = payload.payload;
        setChatMessages((prev) => [...prev, msg]);

        // Only notify for OTHER people's messages
        if (msg.user_id !== user.id) {
          playPing();
          setChatToast(msg);
          // Auto-dismiss after 5s (unless user is replying)
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => {
            setChatToast(null);
            setIsReplying(false);
            setReplyText("");
          }, 5000);

          // Update tab title with unread count
          if (!document.hasFocus()) {
            unreadCountRef.current += 1;
            document.title = `(${unreadCountRef.current}) CenInfo`;

            // Show native browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`${msg.username} — Watch Party`, {
                  body: msg.text,
                  icon: msg.avatar,
                  tag: 'watch-party-chat',
                });
              } catch { /* ignore */ }
            }
          }
        }
      })
      .on('broadcast', { event: 'start_movie' }, () => {
        setIsStarted(true);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          const username = profile?.username || user.email.split('@')[0];
          const avatar = profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
          await channel.track({
            user_id: user.id,
            username,
            avatar,
            is_started: false,
            joined_at: new Date().toISOString()
          });
        }
      });

    // --- ESC / Fullscreen exit syncs cinema mode ---
    const handleFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsCinemaMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('focus', handleFocus);
      document.title = origTitle;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, user, navigate, imdbID]);

  // --- Auto-scroll chat ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ============================================================
  //  HANDLERS
  // ============================================================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelRef.current) return;
    const myProfile = participants.find(p => p.user_id === user.id);
    const msg = {
      id: Date.now(),
      text: newMessage,
      user_id: user.id,
      username: myProfile?.username || "Me",
      avatar: myProfile?.avatar,
      timestamp: new Date().toISOString()
    };
    // Optimistic update (instant for sender)
    setChatMessages(prev => [...prev, msg]);
    setNewMessage("");
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
  };

  const handleStartMovie = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: 'broadcast', event: 'start_movie', payload: { started_by: user.id } });
    const myProfile = participants.find(p => p.user_id === user.id);
    if (myProfile) { 
      await channelRef.current.track({ ...myProfile, is_started: true });
    }
    setIsStarted(true);
  };

  const handleStartReply = () => {
    setIsReplying(true);
    // Cancel the auto-dismiss while replying
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    // Focus the input on next render
    setTimeout(() => replyInputRef.current?.focus(), 50);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !channelRef.current) return;
    const myProfile = participants.find(p => p.user_id === user.id);
    const msg = {
      id: Date.now(),
      text: replyText,
      user_id: user.id,
      username: myProfile?.username || "Me",
      avatar: myProfile?.avatar,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, msg]);
    setReplyText("");
    setIsReplying(false);
    setChatToast(null);
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
  };

  const dismissToast = () => {
    setChatToast(null);
    setIsReplying(false);
    setReplyText("");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  };

  const enterCinemaMode = () => {
    setIsCinemaMode(true);
    // Also trigger real browser fullscreen on the ENTIRE document (not a child div)
    // This hides the browser address bar/tabs while keeping our toast in the normal DOM
    const el = document.documentElement;
    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
    if (requestFs) requestFs.call(el).catch(() => {});
  };

  const exitCinemaMode = () => {
    setIsCinemaMode(false);
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
    if (exitFs && (document.fullscreenElement || document.webkitFullscreenElement)) {
      exitFs.call(document).catch(() => {});
    }
  };

  // ============================================================
  //  COMPUTED VALUES
  // ============================================================

  const getStreamUrl = () => {
    const id = tmdbId || imdbID;
    const isSeries = movie?.Type === "series";
    const urls = [
      isSeries ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=1&episode=1` : `https://vidsrc.me/embed/movie?tmdb=${id}`,
      isSeries ? `https://embed.su/embed/tv/${id}/1/1` : `https://embed.su/embed/movie/${id}`,
      isSeries ? `https://vidsrc.cc/v2/embed/tv/${id}/1/1` : `https://vidsrc.cc/v2/embed/movie/${id}`,
      isSeries ? `https://vidsrc.net/embed/tv?tmdb=${id}&season=1&episode=1` : `https://vidsrc.net/embed/movie?tmdb=${id}`,
      isSeries ? `https://vidlink.pro/tv/${id}/1/1` : `https://vidlink.pro/movie/${id}`,
      isSeries ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=1&e=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
    ];
    return urls[playerIndex];
  };

  // ============================================================
  //  RENDER
  // ============================================================

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Watch Party...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ff6b6b' }}>{error}</div>;

  // --- Cinema Mode Styles (CSS-based fake fullscreen) ---
  const cinemaModeStyles = isCinemaMode ? {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    paddingTop: 0,
    background: '#000',
  } : {};

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-main)',
      paddingTop: '80px',
      overflow: 'hidden',
      ...cinemaModeStyles,
    }}>

      {/* ========== HEADER BAR ========== */}
      {!isCinemaMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '60px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-fuchsia)' }}>Watch Party:</span> {movie?.Title}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={enterCinemaMode} style={{ background: 'var(--accent-fuchsia)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Maximize size={14} /> Cinema Mode
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <Users size={14} /> {participants.length} watching
            </div>
          </div>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* --- Video Area --- */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: 'black' }}>
          {!isStarted ? (
            // --- LOBBY ---
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95)), url(${movie?.Backdrop || movie?.Poster})`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '40px' }}>
              <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '500px', boxShadow: 'var(--shadow-xl)' }}>
                {movie?.Poster && <img src={movie.Poster} alt="Poster" style={{ width: '120px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />}
                <h2 style={{ fontSize: '28px', marginBottom: '12px', fontWeight: '800' }}>Waiting in Lobby</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>The movie is paused for everyone. When you are all ready, anyone can click Start to reveal the player simultaneously.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={handleStartMovie} className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px', fontWeight: 'bold' }}>
                    <PlayCircle size={24} style={{ marginRight: '8px' }} /> Start Movie For Everyone
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // --- VIDEO PLAYER ---
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe
                src={getStreamUrl()}
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0, zIndex: 1 }}
              />
              {/* Server Selector */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                <select
                  value={playerIndex}
                  onChange={(e) => setPlayerIndex(Number(e.target.value))}
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', backdropFilter: 'blur(10px)', outline: 'none' }}
                >
                  {SERVER_NAMES.map((name, i) => (
                    <option key={i} value={i}>Server {i + 1} ({name})</option>
                  ))}
                </select>
              </div>
              {/* Cinema Mode Exit Button (top-right in cinema mode) */}
              {isCinemaMode && (
                <button
                  onClick={exitCinemaMode}
                  style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)' }}
                >
                  <Minimize size={14} /> Exit Cinema
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- Sidebar Chat (hidden in cinema mode) --- */}
        {!isCinemaMode && (
          <div style={{ width: '350px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--accent-violet)" />
              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Live Chat</span>
            </div>

            {/* Participants */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {participants.map(p => (
                <div key={p.user_id} title={p.username} style={{ position: 'relative' }}>
                  <img src={p.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-fuchsia)' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
                </div>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '40px' }}>
                  Welcome to the Watch Party! Chat with your friends here.
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.user_id === user.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <img src={msg.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{msg.username}</span>
                        <div style={{ background: isMe ? 'var(--accent-fuchsia)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: '16px', borderTopRightRadius: isMe ? '4px' : '16px', borderTopLeftRadius: !isMe ? '4px' : '16px', fontSize: '14px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 16px', borderRadius: '24px', fontSize: '14px', outline: 'none' }}
                />
                <button type="submit" disabled={!newMessage.trim()} style={{ background: newMessage.trim() ? 'var(--accent-fuchsia)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                  <Send size={16} style={{ marginLeft: '-2px' }} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========== CHAT TOAST (rendered OUTSIDE the video div, ABOVE everything) ========== */}
        <AnimatePresence>
          {chatToast && isCinemaMode && (
            <motion.div
              key="chat-toast"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                bottom: '32px',
                right: '32px',
                zIndex: 100000,
                width: '340px',
                background: 'rgba(15, 15, 20, 0.92)',
                backdropFilter: 'blur(24px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
                overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent-fuchsia), var(--accent-violet), var(--accent-fuchsia))', width: '100%' }} />

              {/* Content */}
              <div style={{ padding: '16px' }}>
                {/* Header row: avatar + name + dismiss */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <img src={chatToast.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--accent-fuchsia)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{chatToast.username}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>just now</div>
                  </div>
                  <button onClick={dismissToast} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Message body */}
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, wordBreak: 'break-word', marginBottom: '12px' }}>
                  {chatToast.text}
                </div>

                {/* Reply section */}
                {!isReplying ? (
                  <button
                    onClick={handleStartReply}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    Reply to {chatToast.username}...
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReply} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      ref={replyInputRef}
                      type="text"
                      autoFocus
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      style={{
                        background: replyText.trim() ? 'var(--accent-fuchsia)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        width: '40px',
                        borderRadius: '12px',
                        cursor: replyText.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
