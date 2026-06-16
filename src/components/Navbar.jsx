import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Compass, BookmarkPlus, PlayCircle, Film, Star, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchLiveSearch } from "../services/api";
import logo from "../assets/CenInfoLogo.png";

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, favorites, setShowAuth, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePreview, setActivePreview] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isSearchOpen]);

  // Live Search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        const res = await fetchLiveSearch(query);
        setLiveResults(res);
        if (res.length > 0) setActivePreview(res[0]);
        else setActivePreview(null);
        setIsSearching(false);
      } else {
        setLiveResults([]);
        setActivePreview(null);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchOpen(false);
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <>
      <header 
        className="main-header"
        style={{
          width: scrolled ? '80%' : '95%',
          top: scrolled ? '15px' : '20px',
        }}
      >
        <div className="header-left">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <img className="logo" src={logo} alt="CenInfo" />
          </Link>

          <nav className="nav-links-horizontal desktop-only" aria-label="Main navigation">
            <Link to="/" className={`nav-link-btn ${location.pathname === '/' ? 'active' : ''}`}>
              Explore
            </Link>
            <Link to="/discover" className={`nav-link-btn ${location.pathname === '/discover' ? 'active' : ''}`}>
              Discover
            </Link>
            <button
              className="nav-link-btn"
              onClick={() => {
                if (!user) { setShowAuth(true); return; }
                navigate("/library");
              }}
            >
              My Library
              {favorites.length > 0 && <span className="nav-badge">{favorites.length}</span>}
            </button>
          </nav>
        </div>

        <button className="search-trigger desktop-only" onClick={() => setIsSearchOpen(true)}>
          <Search size={16} />
          <span>Search movies, series...</span>
        </button>

        <div className="header-right desktop-only">
          {user && (
            <Link to="/profile" className="auth-btn login">
              Profile
            </Link>
          )}
          {user ? (
            <button className="auth-btn logout" onClick={signOut}>Sign Out</button>
          ) : (
            <button className="auth-btn login" onClick={() => setShowAuth(true)}>Sign In</button>
          )}
        </div>
        
        <div className="mobile-header-actions">
          <button className="mobile-search-btn" onClick={() => setIsSearchOpen(true)}>
            <Search size={20} />
          </button>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* MOBILE HAMBURGER MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(10, 0, 20, 0.95)', backdropFilter: 'blur(20px)', zIndex: 4000, display: 'flex', flexDirection: 'column', padding: '100px 30px' }}
            initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <button style={{ position: 'absolute', top: '30px', right: '30px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setIsMobileMenuOpen(false)}>
              <X size={32} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <Link to="/" style={{ color: 'white', fontSize: '32px', fontWeight: '800', textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>Explore</Link>
              <Link to="/discover" style={{ color: 'white', fontSize: '32px', fontWeight: '800', textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>Discover</Link>
              <button
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '32px', fontWeight: '800', textAlign: 'left', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (!user) { setShowAuth(true); return; }
                  navigate("/library");
                }}
              >
                My Library {favorites.length > 0 && <span className="nav-badge" style={{ fontSize: '16px' }}>{favorites.length}</span>}
              </button>
              
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              
              {user && (
                <Link to="/profile" style={{ color: 'var(--accent-fuchsia)', fontSize: '24px', fontWeight: '700', textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>Profile Dashboard</Link>
              )}
              {user ? (
                <button style={{ background: 'transparent', border: 'none', color: '#ff6b6b', fontSize: '24px', fontWeight: '700', textAlign: 'left', padding: 0, cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); signOut(); }}>Sign Out</button>
              ) : (
                <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-violet)', fontSize: '24px', fontWeight: '700', textAlign: 'left', padding: 0, cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); setShowAuth(true); }}>Sign In / Register</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div 
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '24px', width: '90%', maxWidth: '900px', height: 'fit-content', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 32px)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                <Search size={24} color="var(--accent-fuchsia)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for movies, series..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: 'clamp(16px, 4vw, 24px)', outline: 'none', marginLeft: 'clamp(10px, 3vw, 20px)', fontWeight: '500', fontFamily: 'var(--font-family)', minWidth: 0 }}
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                  <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>ESC</kbd>
                </button>
              </form>
              
              {!query ? (
                <div style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Quick Actions</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <button className="command-quick-btn" onClick={() => { setIsSearchOpen(false); navigate('/discover'); }}>
                      <div className="cq-icon" style={{ background: 'rgba(138, 43, 226, 0.2)', color: 'var(--accent-violet)' }}><Compass size={20} /></div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontWeight: '700', fontSize: '16px', color: 'white' }}>Discover</span>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Find with advanced filters</span>
                      </div>
                    </button>
                    <button className="command-quick-btn" onClick={() => { setIsSearchOpen(false); navigate('/library'); }}>
                      <div className="cq-icon" style={{ background: 'rgba(240, 40, 122, 0.2)', color: 'var(--accent-fuchsia)' }}><BookmarkPlus size={20} /></div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontWeight: '700', fontSize: '16px', color: 'white' }}>My Library</span>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>View your watchlists</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '400px' }}>
                  {/* Left Column: Results List */}
                  <div style={{ flex: '0 0 45%', borderRight: '1px solid var(--border-light)', overflowY: 'auto' }}>
                    {isSearching ? (
                      <p style={{ padding: '20px 32px', color: 'var(--text-muted)' }}>Searching...</p>
                    ) : liveResults.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
                        {liveResults.map(item => (
                          <button 
                            key={`${item.Type}-${item.imdbID}`}
                            onMouseEnter={() => setActivePreview(item)}
                            onClick={() => { setIsSearchOpen(false); navigate(`/movie/${item.imdbID}`); }}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', 
                              background: activePreview?.imdbID === item.imdbID ? 'rgba(255,255,255,0.05)' : 'transparent', 
                              border: 'none', borderLeft: activePreview?.imdbID === item.imdbID ? '3px solid var(--accent-fuchsia)' : '3px solid transparent',
                              width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' 
                            }}
                          >
                            {item.Poster ? (
                              <img src={item.Poster} style={{ width: '40px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '40px', height: '60px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Film size={20} color="var(--text-muted)"/></div>
                            )}
                            <div style={{ overflow: 'hidden' }}>
                              <span style={{ display: 'block', color: 'white', fontWeight: '600', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.Title}</span>
                              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'capitalize' }}>{item.Type} {item.Year !== 'N/A' ? `• ${item.Year}` : ''}</span>
                            </div>
                          </button>
                        ))}
                        <div style={{ padding: '20px 24px 0' }}>
                           <button className="btn-secondary" style={{ width: '100%', padding: '10px' }} onClick={handleSearchSubmit}>See all results</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px 24px' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No exact matches found.</p>
                        <button className="btn-secondary" style={{ width: '100%', padding: '10px' }} onClick={handleSearchSubmit}>Search database for "{query}"</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column: Rich Preview */}
                  <div style={{ flex: '1', background: 'rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {activePreview ? (
                      <div style={{ position: 'relative', flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                        {activePreview.Backdrop ? (
                          <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                            <img src={activePreview.Backdrop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
                          </div>
                        ) : (
                          <div style={{ height: '200px', width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(240,40,122,0.2))' }} />
                        )}
                        <div style={{ padding: '0 32px', marginTop: activePreview.Backdrop ? '-60px' : '32px', position: 'relative', zIndex: 10 }}>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
                            {activePreview.Poster && (
                              <img src={activePreview.Poster} style={{ width: '100px', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', flexShrink: 0 }} />
                            )}
                            <div>
                              <h3 style={{ fontSize: '24px', margin: '0 0 8px 0', lineHeight: 1.2 }}>{activePreview.Title}</h3>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ textTransform: 'capitalize' }}>{activePreview.Type}</span>
                                <span>•</span>
                                <span>{activePreview.Year}</span>
                                <span>•</span>
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>★ {activePreview.imdbRating}</span>
                              </div>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
                            {activePreview.Overview ? (activePreview.Overview.length > 200 ? activePreview.Overview.substring(0, 200) + '...' : activePreview.Overview) : "No description available."}
                          </p>
                          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setIsSearchOpen(false); navigate(`/movie/${activePreview.imdbID}`); }}>
                             <PlayCircle size={18} style={{ marginRight: '8px' }}/> View Details
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        {isSearching ? 'Searching...' : 'Hover a result to preview'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
