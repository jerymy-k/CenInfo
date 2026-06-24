import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LibraryProvider } from "./context/LibraryContext";
import { SocialProvider } from "./context/SocialContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AnimatePresence } from "framer-motion";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import SpecialWelcome from "./components/SpecialWelcome";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Library from "./pages/Library";
import ProfilePage from "./pages/ProfilePage";
import PublicProfile from "./pages/PublicProfile";
import ActorProfile from "./pages/ActorProfile";
import Discover from "./pages/Discover";
import SharedList from "./pages/SharedList";
import ProtectedRoute from "./components/ProtectedRoute";
import WatchParty from "./pages/WatchParty";
import Downloads from "./pages/Downloads";
import AIChatbot from "./components/AIChatbot";

import "./App.css";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:imdbID" element={<MovieDetails />} />
        <Route path="/actor/:id" element={<ActorProfile />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/library" element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/list/:userId/:listName" element={<SharedList />} />
        <Route path="/user/:userId" element={<PublicProfile />} />
        <Route path="/watch-party/:roomId" element={
          <ProtectedRoute>
            <WatchParty />
          </ProtectedRoute>
        } />
        <Route path="/downloads" element={
          <ProtectedRoute>
            <Downloads />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function WelcomeWrapper() {
  const { showRazaneWelcome, setShowRazaneWelcome } = useAuth();
  if (!showRazaneWelcome) return null;
  return <SpecialWelcome onClose={() => setShowRazaneWelcome(false)} />;
}

function ConditionalFooter() {
  const location = useLocation();
  if (location.pathname.startsWith('/watch-party')) return null;
  return <Footer />;
}

function MainContent() {
  const location = useLocation();
  const isWatchParty = location.pathname.startsWith('/watch-party');
  return (
    <main className={isWatchParty ? "" : "scrollable-area"} style={isWatchParty ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}>
      <AnimatedRoutes />
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const isWatchParty = location.pathname.startsWith('/watch-party');

  useEffect(() => {
    // Catch OAuth errors that come back from Supabase in the URL hash
    if (window.location.hash && window.location.hash.includes('error=')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const errDesc = params.get('error_description');
      if (errDesc) {
        alert("Supabase Login Error: " + errDesc.replace(/\+/g, ' '));
      }
      // Clear the hash so the alert doesn't keep showing on normal refresh
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <AuthProvider>
      <LibraryProvider>
        <SocialProvider>
          <ThemeProvider>
            <WelcomeWrapper />
            <div className="app-container" style={isWatchParty ? { height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}>
              <Navbar />
              <MainContent />
              <ConditionalFooter />
              <AuthModal />
              <AIChatbot />
            </div>
          </ThemeProvider>
        </SocialProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}