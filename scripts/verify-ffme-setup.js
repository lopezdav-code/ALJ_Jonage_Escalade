#!/usr/bin/env node

/**
 * FFME Competition Scraper - Setup Verification Script
 * 
 * This script verifies that all necessary files and configurations are in place
 * to run the FFME Competition Scraper.
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function check(condition, passMessage, failMessage) {
  if (condition) {
    log(`  ✅ ${passMessage}`, colors.green);
    return true;
  } else {
    log(`  ❌ ${failMessage}`, colors.red);
    return false;
  }
}

log('\n' + '='.repeat(60), colors.cyan);
log('🔍 FFME Competition Scraper - Setup Verification', colors.cyan);
log('='.repeat(60) + '\n', colors.cyan);

let allPassed = true;

// Check files
log('📁 Checking files...', colors.blue);

const filesToCheck = [
  { path: 'migrations/20251217_create_ffme_competitions_index.sql', name: 'Migration file' },
  { path: 'scripts/scrape-ffme-competitions.js', name: 'Node.js CLI scraper' },
  { path: 'scripts/apply-ffme-migration.ps1', name: 'PowerShell migration script' },
  { path: 'scripts/apply-ffme-migration.sh', name: 'Bash migration script' },
  { path: 'scripts/test-ffme-scraper.js', name: 'Test script' },
  { path: 'src/components/competitions/FFMECompetitionScraper.jsx', name: 'React component' },
  { path: 'src/services/ffmeCompetitionsService.js', name: 'Service API' },
  { path: 'src/hooks/useFFMECompetitionScraper.js', name: 'Custom hook' },
  { path: 'docs/ffme-scraper-guide.md', name: 'User documentation' },
  { path: 'FFME_SCRAPER_IMPLEMENTATION.md', name: 'Implementation summary' },
  { path: 'FFME_SCRAPER_SETUP.md', name: 'Setup guide' }
];

let filesOk = true;
for (const file of filesToCheck) {
  const fullPath = path.resolve(file.path);
  const exists = fs.existsSync(fullPath);
  if (!check(exists, `${file.name}`, `${file.name} NOT FOUND: ${file.path}`)) {
    filesOk = false;
  }
}
allPassed = allPassed && filesOk;

// Check package.json for dependencies
log('\n📦 Checking dependencies...', colors.blue);

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  check(
    packageJson.dependencies['@supabase/supabase-js'],
    'Supabase client installed',
    'Supabase client NOT installed'
  );
  
  // Check if cheerio is available (for CLI script)
  const cheerioNeeded = check(
    packageJson.dependencies['cheerio'] || packageJson.devDependencies['cheerio'],
    'Cheerio available',
    'Cheerio NOT found (needed for CLI script: npm install cheerio)'
  );
  
  if (!cheerioNeeded) {
    allPassed = false;
    log('\n  📝 To fix, run: npm install cheerio', colors.yellow);
  }
} catch (error) {
  log(`  ❌ Error reading package.json: ${error.message}`, colors.red);
  allPassed = false;
}

// Check Supabase configuration
log('\n🔐 Checking Supabase configuration...', colors.blue);

const configFile = 'src/lib/customSupabaseClient.js';
if (fs.existsSync(configFile)) {
  const content = fs.readFileSync(configFile, 'utf8');
  
  check(
    content.includes('supabase'),
    'Supabase client configured',
    'Supabase client NOT configured'
  );
  
  check(
    content.includes('createClient'),
    'Supabase client created',
    'Supabase client creation NOT found'
  );
} else {
  log(`  ❌ Config file NOT found: ${configFile}`, colors.red);
  allPassed = false;
}

// Check React configuration
log('\n⚛️  Checking React setup...', colors.blue);

check(
  fs.existsSync('src/pages/Competitions.jsx'),
  'Competitions page exists',
  'Competitions page NOT found'
);

// Check that FFMECompetitionScraper is imported
if (fs.existsSync('src/pages/Competitions.jsx')) {
  const content = fs.readFileSync('src/pages/Competitions.jsx', 'utf8');
  check(
    content.includes('FFMECompetitionScraper'),
    'Scraper component imported in Competitions page',
    'Scraper component NOT imported in Competitions page'
  );
}

// Check environment variables
log('\n🔑 Checking environment variables...', colors.blue);

const envFile = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
check(
  !!envFile,
  'Supabase URL configured',
  'Supabase URL NOT configured (VITE_SUPABASE_URL or REACT_APP_SUPABASE_URL)'
);

// Check Node.js version
log('\n🔧 Checking Node.js...', colors.blue);

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
check(
  majorVersion >= 18,
  `Node.js version ${nodeVersion} (OK)`,
  `Node.js version ${nodeVersion} (should be >= 18)`
);

// Results
log('\n' + '='.repeat(60), colors.cyan);

if (allPassed) {
  log('✅ All checks passed! You\'re ready to use FFME Competition Scraper', colors.green);
  log('\n📋 Next steps:', colors.cyan);
  log('1. If not already done, apply the migration:', colors.white);
  log('   - Run: powershell -ExecutionPolicy Bypass -File scripts/apply-ffme-migration.ps1', colors.yellow);
  log('   - Or:  bash scripts/apply-ffme-migration.sh', colors.yellow);
  log('2. Paste the SQL in Supabase SQL Editor and run it', colors.white);
  log('3. Go to Competitions page → "Scraper FFME" tab', colors.white);
  log('4. Start scraping!', colors.white);
} else {
  log('⚠️  Some checks failed. See above for details.', colors.yellow);
  log('\n💡 Common fixes:', colors.cyan);
  log('1. Install missing dependencies: npm install', colors.white);
  log('2. Check your .env or .env.local file', colors.white);
  log('3. Ensure you\'re in the project root directory', colors.white);
}

log('\n📚 Documentation:', colors.cyan);
log('- User guide: docs/ffme-scraper-guide.md', colors.white);
log('- Setup guide: FFME_SCRAPER_SETUP.md', colors.white);
log('- Implementation: FFME_SCRAPER_IMPLEMENTATION.md', colors.white);
log('- Examples: src/components/competitions/FFME_SCRAPER_EXAMPLES.js', colors.white);

log('\n' + '='.repeat(60) + '\n', colors.cyan);

process.exit(allPassed ? 0 : 1);
