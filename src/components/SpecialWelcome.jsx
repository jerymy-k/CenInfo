import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";

export default function SpecialWelcome({ onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Add Google Font dynamically for the elegant aesthetic
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const t = setTimeout(() => setShow(true), 100);
    
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      clearTimeout(t);
    };
  }, []);

  return (
    <motion.div 
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(10, 0, 20, 0.65)',
        backdropFilter: 'blur(30px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Playfair Display", serif'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: 'linear-gradient(145deg, rgba(30, 0, 50, 0.8), rgba(15, 0, 30, 0.95))',
            border: '1px solid rgba(216,180,254,0.3)',
            borderRadius: '24px',
            padding: '60px 40px',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(138,43,226,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Corner Gradients */}
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(216,180,254,0.2)', filter: 'blur(50px)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(138,43,226,0.3)', filter: 'blur(50px)', borderRadius: '50%' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', color: 'rgba(216,180,254,0.8)' }}>
              <Sparkles size={24} strokeWidth={1.5} />
              <Heart size={24} fill="rgba(216,180,254,0.4)" strokeWidth={1.5} />
              <Sparkles size={24} strokeWidth={1.5} />
            </div>
            
            <h2 style={{ 
              color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(24px, 4vw, 32px)', 
              fontWeight: '400', fontStyle: 'italic', margin: '0 0 20px 0',
              letterSpacing: '1px'
            }}>
              A special person deserves a special welcome.
            </h2>
            
            <div style={{ width: '60px', height: '1px', background: 'rgba(216,180,254,0.3)', margin: '30px auto' }} />

            <h1 style={{ 
              fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: '700', color: 'white', margin: '0 0 40px 0',
              textShadow: '0 0 30px rgba(216,180,254,0.4)', letterSpacing: '0px', lineHeight: 1.2
            }}>
              <span style={{ 
                color: 'rgba(216,180,254,0.9)', fontWeight: '600', fontSize: '0.3em', 
                display: 'block', letterSpacing: '6px', textTransform: 'uppercase', 
                marginBottom: '10px', textShadow: 'none', fontStyle: 'normal' 
              }}>
                Welcome Home
              </span>
              Razane
            </h1>
            
            <button
              onClick={onClose}
              style={{ 
                background: 'rgba(216,180,254,0.1)', border: '1px solid rgba(216,180,254,0.5)', 
                color: 'white', padding: '14px 40px', borderRadius: '100px', fontSize: '15px', cursor: 'pointer',
                transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '3px',
                fontFamily: '"Playfair Display", serif', fontWeight: '600'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(216,180,254,0.25)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(216,180,254,0.3)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(216,180,254,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Enter
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
