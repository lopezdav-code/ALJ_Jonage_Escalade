/**
 * Script to scrape FFME competition titles from mycompet.ffme.fr
 * Fetches competition pages and stores the title in the database
 * 
 * Usage: node scripts/scrape-ffme-competitions.js [startId] [endId]
 * Example: node scripts/scrape-ffme-competitions.js 13150 13160
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fetch and parse a FFME competition results page
 * @param {number} ffmeId - The FFME competition ID
 * @returns {Promise<{id: number, title: string} | null>} Competition data or null if error
 */
async function fetchFFMECompetition(ffmeId) {
  try {
    const url = `https://mycompet.ffme.fr/resultat/resultat_${ffmeId}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.warn(`  ❌ HTTP ${response.status} - Stopping scraper`);
      return null; // Stop on first error
    }

    const html = await response.text();
    
    // Parse HTML using cheerio
    const $ = cheerio.load(html);
    
    // Look for title in div.title
    const titleElement = $('div.title').first();
    const title = titleElement.text().trim();

    if (!title) {
      console.warn(`  ⚠️  No title found in div.title - Page might not be a valid competition`);
      return null;
    }

    console.log(`  ✅ Found: "${title}"`);
    return { id: ffmeId, title };
  } catch (error) {
    console.error(`  ❌ Error fetching ID ${ffmeId}:`, error.message);
    return null; // Return null on error (will stop the scraper)
  }
}

/**
 * Save competition to database
 * @param {number} ffmeId - The FFME competition ID
 * @param {string} title - Competition title
 * @returns {Promise<boolean>} Success status
 */
async function saveFFMECompetition(ffmeId, title) {
  try {
    const { error } = await supabase
      .from('ffme_competitions_index')
      .upsert(
        {
          ffme_id: ffmeId,
          title: title,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'ffme_id' }
      );

    if (error) {
      console.error(`  ❌ Database error: ${error.message}`);
      return false;
    }

    console.log(`  💾 Saved to database`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error saving to database:`, error.message);
    return false;
  }
}

/**
 * Main scraping function
 * @param {number} startId - Starting FFME ID
 * @param {number} endId - Ending FFME ID
 */
async function scrapeFFMECompetitions(startId, endId) {
  console.log(`\n🚀 Starting FFME Competition Scraper`);
  console.log(`📊 Range: ${startId} to ${endId}\n`);

  let successCount = 0;
  let errorCount = 0;
  let totalProcessed = 0;

  for (let ffmeId = startId; ffmeId <= endId; ffmeId++) {
    totalProcessed++;
    
    const competition = await fetchFFMECompetition(ffmeId);
    
    if (competition === null) {
      errorCount++;
      console.log(`\n⛔ Stopped at ID ${ffmeId} (first error encountered)`);
      break;
    }

    const saved = await saveFFMECompetition(competition.id, competition.title);
    if (saved) {
      successCount++;
    } else {
      errorCount++;
    }

    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Successfully saved: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📋 Total processed: ${totalProcessed}`);
  console.log(`\n✨ Scraping completed!\n`);
}

// Get command line arguments
const args = process.argv.slice(2);
let startId = 13150;
let endId = 13160;

if (args.length >= 2) {
  startId = parseInt(args[0], 10);
  endId = parseInt(args[1], 10);
}

if (isNaN(startId) || isNaN(endId)) {
  console.error('Invalid arguments. Usage: node scripts/scrape-ffme-competitions.js [startId] [endId]');
  process.exit(1);
}

if (startId > endId) {
  console.error('startId must be less than or equal to endId');
  process.exit(1);
}

// Run the scraper
scrapeFFMECompetitions(startId, endId).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
