/**
 * FFME Competitions service
 * Utilities for fetching and managing FFME competition data
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * Get all indexed FFME competitions
 * @returns {Promise<Array>} List of FFME competitions
 */
export const getFFMECompetitions = async () => {
  try {
    const { data, error } = await supabase
      .from('ffme_competitions_index')
      .select('*')
      .order('ffme_id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching FFME competitions:', error);
    throw error;
  }
};

/**
 * Search FFME competitions by title or ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching competitions
 */
export const searchFFMECompetitions = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Try as ID first
    const idQuery = parseInt(query, 10);
    if (!isNaN(idQuery)) {
      const { data, error } = await supabase
        .from('ffme_competitions_index')
        .select('*')
        .eq('ffme_id', idQuery);

      if (error) throw error;
      if (data && data.length > 0) return data;
    }

    // Search by title
    const { data, error } = await supabase
      .from('ffme_competitions_index')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching FFME competitions:', error);
    throw error;
  }
};

/**
 * Get a specific FFME competition by ID
 * @param {number} ffmeId - FFME competition ID
 * @returns {Promise<Object|null>} Competition data or null
 */
export const getFFMECompetition = async (ffmeId) => {
  try {
    const { data, error } = await supabase
      .from('ffme_competitions_index')
      .select('*')
      .eq('ffme_id', ffmeId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found
      return null;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching FFME competition ${ffmeId}:`, error);
    throw error;
  }
};

/**
 * Get the results page URL for a FFME competition
 * @param {number} ffmeId - FFME competition ID
 * @returns {string} Full URL to the competition results page
 */
export const getFFMECompetitionUrl = (ffmeId) => {
  return `https://mycompet.ffme.fr/resultat/resultat_${ffmeId}`;
};

/**
 * Get FFME competitions within a date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} Competitions created within the date range
 */
export const getFFMECompetitionsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('ffme_competitions_index')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('ffme_id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching FFME competitions by date range:', error);
    throw error;
  }
};

/**
 * Link a FFME competition to a club competition
 * @param {number} competitionId - Club competition ID
 * @param {number} ffmeId - FFME competition ID
 * @returns {Promise<void>}
 */
export const linkFFMECompetition = async (competitionId, ffmeId) => {
  try {
    const { error } = await supabase
      .from('competitions')
      .update({ ffme_results_id: ffmeId })
      .eq('id', competitionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error linking FFME competition:', error);
    throw error;
  }
};

/**
 * Get club competitions linked to FFME competitions
 * @returns {Promise<Array>} Club competitions with FFME data
 */
export const getLinkedFFMECompetitions = async () => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('ffme_results_id')
      .not('ffme_results_id', 'is', null);

    if (error) throw error;
    // Return a format that is expected by the caller (array of objects with ffme_id property)
    return data.map(item => ({ ffme_id: item.ffme_results_id })) || [];
  } catch (error) {
    console.error('Error fetching linked FFME competitions:', error);
    throw error;
  }
};
