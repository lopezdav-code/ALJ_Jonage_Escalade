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
  
  // Cache pour les profils avec Map pour de meilleures performances
  const profileCache = useMemo(() => new Map(), []);
  const pendingProfileRequests = useMemo(() => new Map(), []);

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
        profileCache.set(userId, {
          data,
          timestamp: Date.now()
        });

        return data;
      } catch (profileError) {
        console.error("Error in profile fetch:", profileError);
        return null;
      } finally {
        // Supprimer de la liste des requêtes en cours
        pendingProfileRequests.delete(userId);
      }
    })();

    // Ajouter à la liste des requêtes en cours
    pendingProfileRequests.set(userId, profilePromise);

    return profilePromise;
  }, [profileCache, pendingProfileRequests]);

  const handleSession = useCallback(async (session, isNewLogin = false) => {
    try {
      const previousUser = user;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Version simplifiée : profil par défaut pour éviter les requêtes excessives
        let profileData = { role: 'member', member_id: null };
        
        // Toujours essayer de récupérer le profil pour s'assurer d'avoir les bonnes données
        try {
          const data = await fetchUserProfile(currentUser.id);
          if (data) {
            profileData = data;
          }
        } catch (profileError) {
          console.warn("Utilisation du profil par défaut suite à l'erreur:", profileError.message);
          // Si on a un cache même expiré, l'utiliser plutôt que le défaut
          if (profileCache.has(currentUser.id)) {
            const cached = profileCache.get(currentUser.id);
            if (cached && cached.data) {
              profileData = cached.data;
            }
          }
        }

        setProfile(profileData);

        // Logger la connexion seulement pour les nouvelles sessions réelles
        if (isNewLogin && !previousUser) {
          try {
            await logConnection(currentUser, 'login', profileData);
          } catch (logError) {
            console.warn('Logging ignoré suite à l\'erreur:', logError.message);
          }
        }
      } else {
        // Déconnexion - logging simplifiée
        if (previousUser) {
          try {
            await logDisconnection(previousUser, profile);
          } catch (logError) {
            console.warn('Logging de déconnexion ignoré:', logError.message);
          }
        }
        setProfile(null);
      }
    } catch (error) {
      console.error("Error in handleSession:", error);
      // En cas d'erreur, au moins définir les états de base
      setUser(session?.user ?? null);
      setProfile(session?.user ? { role: 'member' } : null);
    } finally {
      setLoading(false);
    }
  }, [user, logConnection, logDisconnection, profile, fetchUserProfile, profileCache]);

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
  const isEncadrant = useMemo(() => ['encadrant', 'admin'].includes(profile?.role), [profile]);
  const isAdherent = useMemo(() => ['adherent', 'encadrant', 'admin'].includes(profile?.role), [profile]);
  const isBureau = useMemo(() => ['bureau', 'admin'].includes(profile?.role), [profile]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    isAdmin,
    isEncadrant,
    isAdherent,
    isBureau,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, profile, isAdmin, isEncadrant, isAdherent, isBureau, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};