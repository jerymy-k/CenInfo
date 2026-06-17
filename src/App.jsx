import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
      </Routes>
    </AnimatePresence>
  );
}

function WelcomeWrapper() {
  const { showRazaneWelcome, setShowRazaneWelcome } = useAuth();
  if (!showRazaneWelcome) return null;
  return <SpecialWelcome onClose={() => setShowRazaneWelcome(false)} />;
}

export default function App() {
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
      <ThemeProvider>
        <WelcomeWrapper />
        <div className="app-container">
          <Navbar />
          <main className="scrollable-area">
            <AnimatedRoutes />
          </main>
          <Footer />
          <AuthModal />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}