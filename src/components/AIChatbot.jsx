import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, Loader2 } from "lucide-react";
import { chatWithCenInfo } from "../services/ai";
import { fetchLiveSearch } from "../services/api";
import ChatMovieCard from "./ChatMovieCard";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Hi! I'm CenInfo AI. 🍿\nLooking for a movie or TV show? Tell me what you're in the mood for!", 
      resolvedMovies: [] 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await chatWithCenInfo(messages, userMessage.text);
      
      let resolvedMovies = [];
      if (aiResponse.recommended_movies && aiResponse.recommended_movies.length > 0) {
        // Resolve movie details using our existing TMDB search
        const searchPromises = aiResponse.recommended_movies.map(async (title) => {
          // Clean up the query string slightly for better TMDB results
          const query = title.replace(/\([^)]*\)/g, '').trim(); // removes "(2010)"
          const results = await fetchLiveSearch(query);
          return results.length > 0 ? results[0] : null;
        });
        
        const results = await Promise.all(searchPromises);
        resolvedMovies = results.filter(movie => movie !== null);
      }

      setMessages(prev => [...prev, {
        role: "ai",
        text: aiResponse.text,
        recommended_movies: aiResponse.recommended_movies,
        resolvedMovies
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: "Oops, something went wrong. Make sure you added your Gemini API key!", 
        resolvedMovies: [] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="ai-chatbot-btn"
            style={{
              position: 'fixed',
              height: '60px',
              width: '60px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-blue))',
              border: 'none',
              boxShadow: '0 10px 25px rgba(240,40,122,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              color: 'white'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="ai-chatbot-window"
            style={{
              position: 'fixed',
              height: '600px',
              maxHeight: '80vh',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 10000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(240,40,122,0.1), rgba(123,97,255,0.1))',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>CenInfo AI</h3>
                  <span style={{ fontSize: '12px', color: 'var(--accent-fuchsia)' }}>Movie Matchmaker</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                    background: msg.role === 'user' ? 'var(--accent-fuchsia)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                  </div>
                  
                  {/* Render Movie Cards if AI recommended any */}
                  {msg.role === 'ai' && msg.resolvedMovies && msg.resolvedMovies.length > 0 && (
                    <div style={{ width: '100%', maxWidth: '95%', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Recommendations:</span>
                      {msg.resolvedMovies.map((movie, mIdx) => (
                        <ChatMovieCard key={mIdx} movie={movie} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '13px' }}>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{
              padding: '16px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: '12px',
              background: 'var(--bg-card)'
            }}>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for a movie recommendation..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  background: input.trim() && !isLoading ? 'var(--accent-fuchsia)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={18} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
