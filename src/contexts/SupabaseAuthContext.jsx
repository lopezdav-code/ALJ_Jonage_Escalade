import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useConnectionLogger } from '@/hooks/useConnectionLogger';
import { PERFORMANCE_CONFIG, performanceUtils } from '@/config/performance';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const { logConnection, logDisconnection } = useConnectionLogger();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileCache, setProfileCache] = useState(new Map()); // Cache pour éviter les requêtes répétées
  const [pendingProfileRequests, setPendingProfileRequests] = useState(new Map()); // Éviter les requêtes simultanées

  // Fonction pour récupérer le profil avec cache et éviter les requêtes simultanées
  const fetchUserProfile = useCallback(async (userId) => {
    // Vérifier le cache d'abord
    if (profileCache.has(userId)) {
      const cached = profileCache.get(userId);
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < 300000) { // Cache valide pendant 5 minutes
        return cached.data;
      }
    }

    // Vérifier si une requête est déjà en cours pour cet utilisateur
    if (pendingProfileRequests.has(userId)) {
      return pendingProfileRequests.get(userId);
    }

    // Créer une nouvelle requête
    const profilePromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, member_id, members(id, first_name, last_name)')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
          return null;
        }

        // Mettre en cache le résultat
        setProfileCache(prev => new Map(prev.set(userId, {
          data,
          timestamp: Date.now()
        })));

        return data;
      } catch (profileError) {
        console.error("Error in profile fetch:", profileError);
        return null;
      } finally {
        // Supprimer de la liste des requêtes en cours
        setPendingProfileRequests(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }
    })();

    // Ajouter à la liste des requêtes en cours
    setPendingProfileRequests(prev => new Map(prev.set(userId, profilePromise)));

    return profilePromise;
  }, [profileCache]);

  const handleSession = useCallback(async (session, isNewLogin = false) => {
    try {
      const previousUser = user;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Utiliser la fonction avec cache
          const data = await fetchUserProfile(currentUser.id);
          setProfile(data);

          // Logger la connexion si c'est une nouvelle session et qu'il n'y avait pas d'utilisateur avant
          if (isNewLogin || (!previousUser && currentUser)) {
            // Passer les données du profil pour éviter une requête supplémentaire
            await logConnection(currentUser, 'login', data);
          }
        } catch (profileError) {
          console.error("Error in profile fetch:", profileError);
          setProfile(null);
        }
      } else {
        // Logger la déconnexion si il y avait un utilisateur avant
        if (previousUser) {
          // Utiliser les données du profil existant si disponibles
          await logDisconnection(previousUser, profile);
        }
        setProfile(null);
      }
    } catch (error) {
      console.error("Error in handleSession:", error);
    } finally {
      setLoading(false);
    }
  }, [user, logConnection, logDisconnection, profile, fetchUserProfile]);

  useEffect(() => {
    let isMounted = true;
    
    // Timeout de sécurité pour éviter les chargements infinis
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 secondes max
    
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (isMounted) {
          await handleSession(session);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          // Déterminer si c'est une nouvelle connexion
          const isNewLogin = event === 'SIGNED_IN';
          await handleSession(session, isNewLogin);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    }
  }, [handleSession, loading]);

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