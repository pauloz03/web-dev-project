import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../Supabase/client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await client.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('auth_user', JSON.stringify({ user: data.user }));
      } else {
        const saved = localStorage.getItem('auth_user');
        if (saved) {
          const authData = JSON.parse(saved);
          setUser(authData.user);
          setIsAuthenticated(true);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        localStorage.setItem('auth_user', JSON.stringify({ user: session.user }));
      } else {
        localStorage.removeItem('auth_user');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('auth_user', JSON.stringify({ user: data.user }));
  };

  const signup = async (email, password) => {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('auth_user', JSON.stringify({ user: data.user }));
  };

  const logout = async () => {
    await client.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};


