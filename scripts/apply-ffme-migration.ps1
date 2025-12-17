# Script to apply FFME Competitions Index migration
# This script displays the SQL and helps apply it to Supabase

Write-Host "🚀 FFME Competitions Index Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "migrations\20251217_create_ffme_competitions_index.sql"

if (Test-Path $sqlFile) {
    Write-Host "✅ Migration file found: $sqlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Open https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White  
    Write-Host "3. Go to SQL Editor" -ForegroundColor White
    Write-Host "4. Click 'New query'" -ForegroundColor White
    Write-Host "5. Copy the SQL code below" -ForegroundColor White
    Write-Host "6. Paste it and click 'Run'" -ForegroundColor White
    Write-Host "7. Verify the table is created (ffme_competitions_index)" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 SQL CODE:" -ForegroundColor Cyan
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    Get-Content $sqlFile
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💾 Copy SQL to clipboard? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -match '^[Yy]$') {
        Get-Content $sqlFile -Raw | Set-Clipboard
        Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
        Write-Host "   Paste it in Supabase SQL Editor and run it." -ForegroundColor Green
    }
} else {
    Write-Host "❌ Migration file not found: $sqlFile" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root." -ForegroundColor Red
}

Write-Host ""
Write-Host "📚 After migration, check:" -ForegroundColor Yellow
Write-Host "1. Go to Tables in Supabase" -ForegroundColor White
Write-Host "2. Look for 'ffme_competitions_index' table" -ForegroundColor White
Write-Host "3. Verify columns: id, ffme_id, title, created_at, updated_at" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Then you can use the FFME Competition Scraper!" -ForegroundColor Green
