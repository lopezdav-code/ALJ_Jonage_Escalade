import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useConnectionLogger } from '@/hooks/useConnectionLogger';
import { PERFORMANCE_CONFIG, performanceUtils } from '@/config/performance';

const AuthContext = createContext(undefined);

/**
 * Role Determination Logic:
 * 1. Admin: profiles.role = 'admin'
 * 2. Bureau: exists in bureau table with role != 'Bénévole'
 * 3. Encadrant: exists in bureau table with role = 'Bénévole'
 * 4. Adhérent: exists in members table with groupe_id NOT EMPTY
 * 5. User: authenticated but none of the above
 * 6. Public: not authenticated
 */

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

  /**
   * Détermine le rôle de l'utilisateur selon la nouvelle logique:
   * - Check admin dans profiles
   * - Check bureau (role != 'Bénévole') pour Bureau
   * - Check bureau (role = 'Bénévole') pour Encadrant
   * - Check membres (groupe_id not null) pour Adhérent
   * - Sinon: user
   */
  const determineUserRole = useCallback(async (profileData) => {
    if (!profileData) return 'user';

    // 1. Priority 1: Admin role in profiles table
    if (profileData.role === 'admin') {
      return 'admin';
    }

    // 2. Check bureau table if member_id exists
    if (profileData.member_id) {
      try {
        // Check bureau table
        const { data: bureauData, error: bureauError } = await supabase
          .from('bureau')
          .select('id, role, members_id')
          .eq('members_id', profileData.member_id)
          .maybeSingle();

        if (!bureauError && bureauData) {
          // Priority 2: Bureau (role != 'Bénévole')
          if (bureauData.role && bureauData.role !== 'Bénévole') {
            return 'bureau';
          }
          // Priority 3: Encadrant (role = 'Bénévole')
          if (bureauData.role === 'Bénévole') {
            return 'encadrant';
          }
        }

        // 3. Check membres table for adherent status
        const { data: memberData, error: memberError } = await supabase
          .from('membres')
          .select('id, groupe_id')
          .eq('id', profileData.member_id)
          .maybeSingle();

        // Priority 4: Adhérent (has groupe_id)
        if (!memberError && memberData && memberData.groupe_id) {
          return 'adherent';
        }
      } catch (error) {
        console.error('Error determining user role:', error);
      }
    }

    // Priority 5: Default to 'user' for authenticated users
    return 'user';
  }, []);

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
          .select('id, role, member_id, members(id, first_name, last_name, groupe_id)')
          .eq('id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
          return null;
        }

        let profileData = data;

        // If no profile exists, create a default one
        if (!profileData) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, role: null, member_id: null }])
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            return { id: userId, role: 'user', member_id: null };
          }
          profileData = newProfile;
        }

        // Determine role based on new logic
        const determinedRole = await determineUserRole(profileData);
        profileData.computed_role = determinedRole;

        // Mettre en cache le résultat
        profileCache.set(userId, {
          data: profileData,
          timestamp: Date.now()
        });

        return profileData;
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
  }, [profileCache, pendingProfileRequests, determineUserRole]);

  const handleSession = useCallback(async (session, isNewLogin = false) => {
    try {
      const previousUser = user;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Version simplifiée : profil par défaut pour éviter les requêtes excessives
        let profileData = { id: currentUser.id, computed_role: 'user', member_id: null };

        // Toujours essayer de récupérer le profil pour s'assurer d'avoir les bonnes données
        try {
          const data = await fetchUserProfile(currentUser.id);
          if (data) {
            profileData = data;
          }
        } catch (profileError) {
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
            // Logging ignoré
          }
        }
      } else {
        // Déconnexion - logging simplifiée
        if (previousUser) {
          try {
            await logDisconnection(previousUser, profile);
          } catch (logError) {
            // Logging de déconnexion ignoré
          }
        }
        setProfile(null);
      }
    } catch (error) {
      console.error("Error in handleSession:", error);
      // En cas d'erreur, au moins définir les états de base
      setUser(session?.user ?? null);
      setProfile(session?.user ? { id: session.user.id, computed_role: 'user' } : null);
    } finally {
      setLoading(false);
    }
  }, [user, logConnection, logDisconnection, profile, fetchUserProfile, profileCache]);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeoutId = null;

    const getSession = async () => {
      try {
        // Timeout de sécurité pour éviter les chargements infinis
        loadingTimeoutId = setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, 5000); // 5 secondes max

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (isMounted) {
          // Nettoyer le timeout si la session est récupérée avant
          if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
            loadingTimeoutId = null;
          }
          await handleSession(session);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (isMounted) {
          if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
            loadingTimeoutId = null;
          }
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
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
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

  // Role helpers based on computed_role
  const userRole = useMemo(() => {
    if (!user) return 'public';
    return profile?.computed_role || 'user';
  }, [user, profile]);

  const isAdmin = useMemo(() => userRole === 'admin', [userRole]);
  const isBureau = useMemo(() => ['bureau', 'admin'].includes(userRole), [userRole]);
  const isEncadrant = useMemo(() => ['encadrant', 'admin'].includes(userRole), [userRole]);
  const isAdherent = useMemo(() => ['adherent', 'encadrant', 'admin'].includes(userRole), [userRole]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    userRole,
    isAdmin,
    isBureau,
    isEncadrant,
    isAdherent,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => fetchUserProfile(user?.id),
  }), [user, session, loading, profile, userRole, isAdmin, isBureau, isEncadrant, isAdherent, signUp, signIn, signOut, fetchUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
