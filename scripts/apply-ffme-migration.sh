#!/bin/bash

# Script to apply FFME Competitions Index migration
# This script displays the SQL and helps apply it to Supabase

echo "🚀 FFME Competitions Index Migration"
echo "====================================="
echo ""

SQL_FILE="migrations/20251217_create_ffme_competitions_index.sql"

if [ -f "$SQL_FILE" ]; then
    echo "✅ Migration file found: $SQL_FILE"
    echo ""
    echo "📋 INSTRUCTIONS:"
    echo "1. Open https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Click 'New query'"
    echo "5. Copy the SQL code below"
    echo "6. Paste it and click 'Run'"
    echo "7. Verify the table is created (ffme_competitions_index)"
    echo ""
    echo "📝 SQL CODE:"
    echo "---------------------------------------------------"
    cat "$SQL_FILE"
    echo "---------------------------------------------------"
    echo ""
    echo "💾 Copy SQL to clipboard? (Y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Try to copy to clipboard (works on macOS and Linux with xclip)
        if command -v pbcopy &> /dev/null; then
            # macOS
            cat "$SQL_FILE" | pbcopy
            echo "✅ SQL copied to clipboard (macOS)!"
        elif command -v xclip &> /dev/null; then
            # Linux with xclip
            cat "$SQL_FILE" | xclip -selection clipboard
            echo "✅ SQL copied to clipboard (Linux)!"
        else
            echo "⚠️  Could not copy to clipboard. Please copy manually."
            echo "   Open the file: $SQL_FILE"
        fi
        echo "   Paste it in Supabase SQL Editor and run it."
    fi
else
    echo "❌ Migration file not found: $SQL_FILE"
    echo "   Make sure you're running this from the project root."
fi

echo ""
echo "📚 After migration, check:"
echo "1. Go to Tables in Supabase"
echo "2. Look for 'ffme_competitions_index' table"
echo "3. Verify columns: id, ffme_id, title, created_at, updated_at"
echo ""
echo "🎉 Then you can use the FFME Competition Scraper!"
