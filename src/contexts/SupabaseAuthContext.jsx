import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, member_id, members(id, first_name, last_name)')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "exact one row" error if profile not found yet
        console.error("Error fetching user profile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    }
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    await handleSession(null); // Force clear local state

    if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    } else {
      toast({ title: "Déconnexion réussie." });
    }

    return { error };
  }, [toast, handleSession]);

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);
  const isAdherent = useMemo(() => ['adherent', 'admin'].includes(profile?.role), [profile]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    isAdmin,
    isAdherent,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, profile, isAdmin, isAdherent, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};