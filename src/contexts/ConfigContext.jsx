import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_config').select('config_key, config_value');
    
    if (error) {
      console.error("Error fetching site config:", error);
    } else {
      const newConfig = data.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {});
      setConfig(newConfig);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
    
    const channel = supabase
      .channel('site_config_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, (payload) => {
          fetchConfig();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [fetchConfig]);

  const updateConfig = async (key, value) => {
    if (!isAdmin) {
      console.error("User is not authorized to update config.");
      return { error: 'Not authorized' };
    }
    
    const { data, error } = await supabase
      .from('site_config')
      .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' })
      .select()
      .single();

    if (error) {
      console.error(`Error updating config key ${key}:`, error);
    } else if (data) {
      setConfig(prev => ({...prev, [data.config_key]: data.config_value}));
    }

    return { data, error };
  };

  const value = {
    config,
    loadingConfig: loading,
    updateConfig,
    refetchConfig: fetchConfig
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};