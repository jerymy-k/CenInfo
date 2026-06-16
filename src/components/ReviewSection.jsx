import { useState, useEffect } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

export default function ReviewSection({ movieId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (movieId) {
      fetchReviews();
    }
  }, [movieId]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.warn("Reviews table may not exist yet:", error.message);
        setReviews([]);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return setError("You must be logged in to review.");
    if (rating === 0) return setError("Please select a rating.");
    if (!content.trim()) return setError("Please write a review.");
    
    setSubmitting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert([
          {
            movie_id: movieId,
            user_id: user.id,
            user_email: user.email,
            rating,
            content: content.trim()
          }
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setReviews([data[0], ...reviews]);
      }
      setRating(0);
      setContent("");
    } catch (err) {
      setError("Failed to submit review. Your backend 'reviews' table might not be created yet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: '60px', borderTop: '1px solid var(--border-light)', paddingTop: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <MessageSquare size={28} color="var(--accent-fuchsia)" />
        <h2 style={{ fontSize: '32px', margin: 0 }}>Community Reviews</h2>
      </div>

      {user ? (
        <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '16px', marginBottom: '40px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px', marginTop: 0 }}>Write a Review</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Your Rating</p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(star => (
                  <Star 
                    key={star} 
                    size={32} 
                    fill={(hoverRating || rating) >= star ? "var(--accent-amber)" : "transparent"}
                    color={(hoverRating || rating) >= star ? "var(--accent-amber)" : "var(--text-muted)"}
                    style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
                <span style={{ marginLeft: '10px', fontSize: '24px', fontWeight: 'bold', color: rating > 0 ? 'white' : 'var(--text-muted)' }}>
                  {rating > 0 ? `${rating}/10` : ''}
                </span>
              </div>
            </div>

            <textarea 
              placeholder="What did you think of this movie?"
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '16px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '16px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-fuchsia)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
            />

            {error && <p style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '14px', padding: '10px', background: 'rgba(255,77,79,0.1)', borderRadius: '6px' }}>{error}</p>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Posting..." : <><Send size={18} style={{ marginRight: '8px' }}/> Post Review</>}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '16px', marginBottom: '40px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Log in to leave a review and join the discussion.</p>
        </div>
      )}

      <div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
             <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-fuchsia)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
             Loading reviews...
          </div>
        ) : reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map(review => (
              <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_email}`} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0 }}>{review.user_email.split('@')[0]}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 193, 7, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                    <Star size={16} fill="var(--accent-amber)" color="var(--accent-amber)" />
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-amber)' }}>{review.rating}/10</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{review.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} opacity={0.5} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px' }}>No reviews yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
