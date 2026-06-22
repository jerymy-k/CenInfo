/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showRazaneWelcome, setShowRazaneWelcome] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuth(false);
        
        if (event === 'SIGNED_IN') {
          // Auto-create profile if missing so their name appears in community discussions
          supabase.from("profiles").select("id").eq("id", session.user.id).single().then(({ data }) => {
            if (!data) {
              supabase.from("profiles").insert({
                id: session.user.id,
                username: session.user.email.split('@')[0],
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
              }).then();
            }
          });

          // Special Welcome logic
          if (session.user.email === 'wakhidirazane@gmail.com' && !localStorage.getItem('razane_welcomed')) {
            setShowRazaneWelcome(true);
            localStorage.setItem('razane_welcomed', 'true');
          }
        }
      } else {
        localStorage.removeItem('razane_welcomed');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      showAuth, 
      setShowAuth, 
      signOut,
      showRazaneWelcome,
      setShowRazaneWelcome,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
