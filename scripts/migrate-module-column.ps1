# Script PowerShell pour ajouter la colonne 'module' via Supabase Management API
# Ce script guide l'utilisateur pour exécuter le SQL via le dashboard Supabase

Write-Host "🚀 Migration: Ajout de la colonne 'module' à passeport_validations" -ForegroundColor Cyan
Write-Host ""

# Lire le fichier SQL
$sqlFile = "scripts\supabase-add-module-column.sql"
if (Test-Path $sqlFile) {
    Write-Host "✅ Fichier SQL trouvé: $sqlFile" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier SQL introuvable: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 INSTRUCTIONS POUR EXÉCUTER LA MIGRATION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrez votre navigateur" -ForegroundColor White
Write-Host "2. Allez sur: https://supabase.com/dashboard/project/_/sql" -ForegroundColor White
Write-Host "3. Remplacez '_' par l'ID de votre projet" -ForegroundColor White
Write-Host "4. Créez une 'New query'" -ForegroundColor White
Write-Host "5. Copiez le contenu du fichier SQL (voir ci-dessous)" -ForegroundColor White
Write-Host "6. Collez dans l'éditeur SQL" -ForegroundColor White
Write-Host "7. Cliquez sur 'Run' (ou Ctrl+Enter)" -ForegroundColor White
Write-Host ""

Write-Host "📄 CONTENU DU FICHIER SQL:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray

# Afficher le contenu du fichier
Get-Content $sqlFile | ForEach-Object {
    Write-Host $_ -ForegroundColor White
}

Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Proposer de copier dans le presse-papiers
Write-Host "💡 Voulez-vous copier le SQL dans le presse-papiers? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'O' -or $response -eq 'o') {
    Get-Content $sqlFile -Raw | Set-Clipboard
    Write-Host "✅ SQL copié dans le presse-papiers!" -ForegroundColor Green
    Write-Host "   Vous pouvez maintenant coller (Ctrl+V) dans Supabase SQL Editor" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Vérification après migration:" -ForegroundColor Cyan
Write-Host "   - La colonne module devrait apparaître dans la table" -ForegroundColor White
Write-Host "   - Valeurs acceptées: NULL, bloc, difficulte" -ForegroundColor White
Write-Host "   - 2 index créés pour optimiser les requêtes" -ForegroundColor White
Write-Host ""

Write-Host "✅ Une fois la migration effectuée, testez avec:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Puis validez un passeport en sélectionnant un module" -ForegroundColor White
Write-Host ""
