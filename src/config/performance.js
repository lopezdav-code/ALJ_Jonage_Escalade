// Configuration pour les optimisations de performance

export const PERFORMANCE_CONFIG = {
  // Cache des profils utilisateur
  PROFILE_CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes en millisecondes
    MAX_SIZE: 100 // Nombre maximum de profils en cache
  },

  // Limitation des requêtes
  RATE_LIMITING: {
    MAX_CONCURRENT_REQUESTS: 3,
    MAX_CONCURRENT_LOGS: 2,
    REQUEST_TIMEOUT: 3000, // 3 secondes
    LOG_TIMEOUT: 2000 // 2 secondes
  },

  // Configuration de retry
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 2,
    INITIAL_DELAY: 1000, // 1 seconde
    BACKOFF_MULTIPLIER: 1.5
  },

  // Debounce et throttling
  DEBOUNCE: {
    SEARCH_DELAY: 300, // millisecondes
    FILTER_DELAY: 500,
    RESIZE_DELAY: 250
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },

  // Supabase optimizations
  SUPABASE: {
    // Réduire le nombre de colonnes sélectionnées
    MINIMAL_PROFILE_SELECT: 'id, member_id, email',
    MINIMAL_MEMBER_SELECT: 'id, first_name, last_name, email',
    
    // Limiter les requêtes réaltime
    REALTIME_THROTTLE: 2000, // 2 secondes entre les mises à jour
    
    // Batch size pour les opérations en lot
    BATCH_SIZE: 10
  }
};

// Utilitaires pour les optimisations
export const performanceUtils = {
  // Créer un délai (pour debounce/throttle)
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Créer une promesse avec timeout
  withTimeout: (promise, timeoutMs) => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  },

  // Calculer le délai de retry avec backoff exponentiel
  calculateRetryDelay: (attempt) => {
    const { INITIAL_DELAY, BACKOFF_MULTIPLIER } = PERFORMANCE_CONFIG.RETRY_CONFIG;
    return INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
  },

  // Vérifier si le cache est valide
  isCacheValid: (timestamp, ttl = PERFORMANCE_CONFIG.PROFILE_CACHE.TTL) => {
    return Date.now() - timestamp < ttl;
  },

  // Nettoyer le cache expiré
  cleanExpiredCache: (cache, ttl = PERFORMANCE_CONFIG.PROFILE_CACHE.TTL) => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp >= ttl) {
        cache.delete(key);
      }
    }
  }
};