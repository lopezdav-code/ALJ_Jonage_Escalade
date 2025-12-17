/**
 * FFME Competition Scraper - Integration Examples
 * 
 * Examples for developers on how to use the FFME Competition Scraper
 * in different contexts and components.
 */

// ============================================================================
// Example 1: Using in a React Component
// ============================================================================

import React, { useState } from 'react';
import { useFFMECompetitionScraper } from '@/hooks/useFFMECompetitionScraper';
import { Button } from '@/components/ui/button';

function MyCompetitionComponent() {
  const [startId, setStartId] = useState(13150);
  const [endId, setEndId] = useState(13160);
  const { loading, progress, results, scrapeCompetitions } = useFFMECompetitionScraper();

  const handleClick = async () => {
    await scrapeCompetitions(startId, endId);
  };

  return (
    <div>
      <input 
        type="number" 
        value={startId} 
        onChange={(e) => setStartId(e.target.value)}
        placeholder="Start ID"
      />
      <input 
        type="number" 
        value={endId} 
        onChange={(e) => setEndId(e.target.value)}
        placeholder="End ID"
      />
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Scraping...' : 'Start Scraper'}
      </Button>
      
      {progress && <p>Progress: {progress.current}/{progress.total}</p>}
      {results && (
        <div>
          <p>Success: {results.success}</p>
          <p>Errors: {results.errors}</p>
        </div>
      )}
    </div>
  );
}

export default MyCompetitionComponent;

// ============================================================================
// Example 2: Using the Service to Search Competitions
// ============================================================================

import { 
  searchFFMECompetitions, 
  getFFMECompetition,
  getFFMECompetitionUrl 
} from '@/services/ffmeCompetitionsService';

async function findCompetition(searchQuery) {
  try {
    // Search by title or ID
    const results = await searchFFMECompetitions(searchQuery);
    console.log('Found competitions:', results);
    
    // Get details for the first result
    if (results.length > 0) {
      const comp = await getFFMECompetition(results[0].ffme_id);
      const url = getFFMECompetitionUrl(results[0].ffme_id);
      
      console.log('Competition:', comp);
      console.log('Results URL:', url);
    }
  } catch (error) {
    console.error('Error searching:', error);
  }
}

// Usage
findCompetition('13150');
findCompetition('Championship');

// ============================================================================
// Example 3: Auto-scraping on Component Mount
// ============================================================================

import { useEffect } from 'react';

function AutoScrapeComponent() {
  const { scrapeCompetitions } = useFFMECompetitionScraper();

  useEffect(() => {
    // Auto-scrape when component mounts
    const runScraper = async () => {
      await scrapeCompetitions(13150, 13160);
    };

    runScraper();
  }, []);

  return <div>Scraper running...</div>;
}

// ============================================================================
// Example 4: Progress Tracking with Custom Callback
// ============================================================================

function ProgressTrackingComponent() {
  const [statusMessage, setStatusMessage] = useState('');

  const handleProgressUpdate = (progress) => {
    setStatusMessage(
      `Processing ID ${progress.currentId}: ${progress.current}/${progress.total}`
    );
  };

  const { scrapeCompetitions } = useFFMECompetitionScraper();

  const handleScrape = async () => {
    await scrapeCompetitions(13150, 13160, handleProgressUpdate);
  };

  return (
    <div>
      <p>{statusMessage}</p>
      <button onClick={handleScrape}>Scrape with Progress</button>
    </div>
  );
}

// ============================================================================
// Example 5: Linking FFME Competitions to Club Competitions
// ============================================================================

import { linkFFMECompetition, getLinkedFFMECompetitions } from '@/services/ffmeCompetitionsService';

async function linkCompetitions() {
  try {
    // Link a club competition to FFME
    await linkFFMECompetition(clubCompetitionId, 13150);
    
    // Get all linked competitions
    const linked = await getLinkedFFMECompetitions();
    console.log('Linked competitions:', linked);
  } catch (error) {
    console.error('Error linking:', error);
  }
}

// ============================================================================
// Example 6: CLI Usage (Node.js)
// ============================================================================

/*
  Default range (13150-13160):
  $ node scripts/scrape-ffme-competitions.js

  Custom range:
  $ node scripts/scrape-ffme-competitions.js 13150 13200

  Output:
  🚀 Starting FFME Competition Scraper
  📊 Range: 13150 to 13160
  
  Fetching: https://mycompet.ffme.fr/resultat/resultat_13150
    ✅ Found: "Competition Title 1"
    💾 Saved to database
  
  Fetching: https://mycompet.ffme.fr/resultat/resultat_13151
    ✅ Found: "Competition Title 2"
    💾 Saved to database
  
  📈 Summary:
     ✅ Successfully saved: 10
     ❌ Errors: 0
     📋 Total processed: 10
*/

// ============================================================================
// Example 7: Error Handling
// ============================================================================

async function robustSearch(query) {
  try {
    const results = await searchFFMECompetitions(query);
    
    if (results.length === 0) {
      console.warn('No competitions found for:', query);
      return null;
    }

    return results[0];
  } catch (error) {
    if (error.message.includes('permission')) {
      console.error('Permission denied. User might not be authenticated.');
    } else if (error.message.includes('network')) {
      console.error('Network error. Check your connection.');
    } else {
      console.error('Unexpected error:', error.message);
    }
    
    return null;
  }
}

// ============================================================================
// Example 8: Batch Processing Multiple Ranges
// ============================================================================

async function scrapeBatchRanges(ranges) {
  const { scrapeCompetitions } = useFFMECompetitionScraper();
  
  for (const { start, end } of ranges) {
    console.log(`\nProcessing range ${start}-${end}...`);
    await scrapeCompetitions(start, end);
    
    // Wait between batches to be respectful
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Usage
const ranges = [
  { start: 13150, end: 13160 },
  { start: 13200, end: 13210 },
  { start: 13300, end: 13310 }
];

scrapeBatchRanges(ranges);

// ============================================================================
// Example 9: Real-time Data Display
// ============================================================================

function LiveCompetitionDisplay() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { scrapeCompetitions, progress } = useFFMECompetitionScraper();

  const loadCompetitions = async () => {
    setLoading(true);
    
    // Scrape new competitions
    await scrapeCompetitions(13150, 13170);
    
    // Load from database
    const { data } = await supabase
      .from('ffme_competitions_index')
      .select('*')
      .order('ffme_id', { ascending: false })
      .limit(20);
    
    setCompetitions(data || []);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={loadCompetitions} disabled={loading}>
        {loading ? 'Loading...' : 'Load Competitions'}
      </button>
      
      {progress && (
        <p>Processing: {progress.currentId}</p>
      )}
      
      <ul>
        {competitions.map(comp => (
          <li key={comp.ffme_id}>
            ID {comp.ffme_id}: {comp.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Example 10: Scheduled Auto-Scraping (Advanced)
// ============================================================================

import { useEffect, useRef } from 'react';

function ScheduledScraper() {
  const scraperRef = useRef(null);
  const { scrapeCompetitions } = useFFMECompetitionScraper();

  useEffect(() => {
    // Scrape every day at 2 AM
    const scheduleDaily = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(2, 0, 0, 0);
      
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const delay = target.getTime() - now.getTime();
      
      scraperRef.current = setTimeout(async () => {
        console.log('Running scheduled scraper...');
        await scrapeCompetitions(13150, 13200);
        scheduleDaily(); // Re-schedule for next day
      }, delay);
    };

    scheduleDaily();

    return () => {
      if (scraperRef.current) {
        clearTimeout(scraperRef.current);
      }
    };
  }, [scrapeCompetitions]);

  return <div>Scheduled scraper active</div>;
}

// ============================================================================
// Example 11: Export to CSV
// ============================================================================

import { getFFMECompetitions } from '@/services/ffmeCompetitionsService';

async function exportToCSV() {
  const competitions = await getFFMECompetitions();
  
  const csv = [
    'FFME_ID,Title,Created_At',
    ...competitions.map(c => 
      `${c.ffme_id},"${c.title.replace(/"/g, '""')}",${c.created_at}`
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ffme_competitions.csv';
  a.click();
}

// ============================================================================
// Example 12: Advanced Query - Date Range
// ============================================================================

import { getFFMECompetitionsByDateRange } from '@/services/ffmeCompetitionsService';

async function getRecentCompetitions() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const competitions = await getFFMECompetitionsByDateRange(
    weekAgo.toISOString(),
    today.toISOString()
  );

  console.log('Competitions added in the last 7 days:', competitions);
}

// ============================================================================
// Testing & Debugging
// ============================================================================

// To test in browser console:
// 1. Import the service
// 2. Call: searchFFMECompetitions('13150').then(console.log)
// 3. Check browser Network tab for fetch requests
// 4. Check database in Supabase dashboard

console.log('FFME Scraper Examples loaded');
console.log('See this file for 12+ integration examples');
