/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

const SocialContext = createContext();

export function SocialProvider({ children }) {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [watchInvites, setWatchInvites] = useState([]);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, title = "Notification") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  async function loadIncomingRequests() {
    const { data: rawRequests, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    
    if (error) {
      console.error("Error fetching incoming requests:", error);
      return;
    }
    
    if (rawRequests && rawRequests.length > 0) {
      const requesterIds = rawRequests.map(r => r.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', requesterIds);
      
      const enriched = rawRequests.map(req => ({
        ...req,
        profile: profiles?.find(p => p.id === req.requester_id) || { username: 'Someone', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester_id}` }
      }));
      setIncomingRequests(enriched);
    } else {
      setIncomingRequests([]);
    }
  }

  useEffect(() => {
    let channel;
    let globalChannel;

    if (user) {
      loadIncomingRequests();

      // Realtime subscription for incoming friend requests
      channel = supabase.channel('realtime_friendships')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${user.id}` },
          () => {
             loadIncomingRequests();
             showToast("You have received a new friend request!", "New Friend Request");
          }
        )
        .subscribe();
        
      // Realtime subscription for ephemeral Watch Party invites
      globalChannel = supabase.channel('global_notifications')
        .on('broadcast', { event: 'watch_invite' }, (payload) => {
          if (payload.payload.receiver_id === user.id) {
            setWatchInvites(prev => [...prev, payload.payload]);
            showToast(`${payload.payload.sender_name} invited you to watch ${payload.payload.movie_title}!`, "Watch Party Invite");
          }
        })
        .subscribe();
    } else {
      setIncomingRequests([]);
      setWatchInvites([]);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (globalChannel) supabase.removeChannel(globalChannel);
    };
  }, [user]);

  async function handleRequest(requestId, action) {
    if (action === 'accept') {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
      showToast("Friend request accepted", "Success");
    } else {
      await supabase.from('friendships').delete().eq('id', requestId);
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  }

  const removeWatchInvite = (inviteId) => {
    setWatchInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const sendWatchInvite = async (friendId, roomId, movieTitle, myUsername) => {
     const channel = supabase.channel('global_notifications');
     await channel.send({
       type: 'broadcast',
       event: 'watch_invite',
       payload: {
         id: Date.now(),
         receiver_id: friendId,
         sender_id: user.id,
         sender_name: myUsername || user.email.split('@')[0],
         room_id: roomId,
         movie_title: movieTitle
       }
     });
     showToast("Invite sent!", "Success");
  };

  return (
    <SocialContext.Provider value={{ incomingRequests, handleRequest, showToast, watchInvites, removeWatchInvite, sendWatchInvite }}>
      {children}
      
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '250px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                <Bell size={18} color="white" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{toast.title}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SocialContext.Provider>
  );
}

export function useSocial() {
  return useContext(SocialContext);
}
