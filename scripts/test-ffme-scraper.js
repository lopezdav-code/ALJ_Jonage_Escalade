/**
 * Quick test/demo script for FFME Competition Scraper
 * 
 * This script demonstrates how to use the scraper both programmatically 
 * and shows the expected data structure.
 * 
 * Usage: node scripts/test-ffme-scraper.js
 */

// Example of what the component receives after scraping
const exampleScraperResults = {
  // When scraping completes successfully
  success: {
    completed: true,
    success: 5,
    errors: 0,
    reason: null,
    stoppedAt: null
  },

  // When scraper encounters an error and stops
  stopped_with_error: {
    completed: false,
    success: 3,
    errors: 1,
    reason: 'HTTP 404 Error',
    stoppedAt: 13153
  },

  // When a page doesn't have a valid title
  invalid_page: {
    completed: false,
    success: 2,
    errors: 1,
    reason: 'No title found (invalid page)',
    stoppedAt: 13152
  }
};

// Example of data structure in ffme_competitions_index table
const exampleDatabaseRecords = [
  {
    id: 1,
    ffme_id: 13150,
    title: 'Coupe du Monde Escalade - Finale Mondiale 2024',
    created_at: '2025-12-17T09:30:00+00:00',
    updated_at: '2025-12-17T09:30:00+00:00'
  },
  {
    id: 2,
    ffme_id: 13151,
    title: 'Championnat National de Cascade de Glace',
    created_at: '2025-12-17T09:31:00+00:00',
    updated_at: '2025-12-17T09:31:00+00:00'
  },
  {
    id: 3,
    ffme_id: 13152,
    title: 'Stage Initiation Escalade - Fontainebleau',
    created_at: '2025-12-17T09:32:00+00:00',
    updated_at: '2025-12-17T09:32:00+00:00'
  }
];

// Example of progress updates during scraping
const exampleProgressUpdates = [
  { current: 1, total: 10, currentId: 13150 },
  { current: 2, total: 10, currentId: 13151 },
  { current: 3, total: 10, currentId: 13152 },
  { current: 4, total: 10, currentId: 13153 }, // This one will fail
  // Scraper stops here
];

console.log('📚 FFME Competition Scraper - Test Data Examples\n');
console.log('='.repeat(60));

console.log('\n✅ Example Results Structure:');
console.log(JSON.stringify(exampleScraperResults, null, 2));

console.log('\n📊 Example Database Records:');
console.log(JSON.stringify(exampleDatabaseRecords, null, 2));

console.log('\n📈 Example Progress Updates:');
console.log(JSON.stringify(exampleProgressUpdates, null, 2));

console.log('\n='.repeat(60));
console.log('\n💡 Test Instructions:');
console.log('1. Go to http://localhost:3000/ALJ_Jonage_Escalade/competitions');
console.log('2. Click on the "Scraper FFME" tab');
console.log('3. Enter start ID: 13150, End ID: 13160');
console.log('4. Click "Démarrer le scraping"');
console.log('5. Watch the progress bar and real-time updates');
console.log('6. Check the database table for the results\n');

console.log('🔍 Verify in Supabase:');
console.log('1. Open https://app.supabase.com');
console.log('2. Go to Tables → ffme_competitions_index');
console.log('3. You should see the scraped competition data\n');

console.log('='.repeat(60) + '\n');
