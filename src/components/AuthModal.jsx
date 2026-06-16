import { useAuth } from "../context/AuthContext";
import Auth from "../Auth";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function AuthModal() {
  const { showAuth, setShowAuth, user } = useAuth();

  if (!showAuth || user) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
        >
          <button 
            className="modal-close" 
            onClick={() => setShowAuth(false)} 
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
          <div className="modal-intro">
            <p className="eyebrow">Member Access</p>
            <h2>Sign in to continue</h2>
          </div>
          <Auth />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
