# Migration: Ajout de la colonne module a passeport_validations

Write-Host "Migration: Ajout de la colonne module" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "scripts\supabase-add-module-column.sql"

if (Test-Path $sqlFile) {
    Write-Host "Fichier SQL trouve: $sqlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Selectionnez votre projet" -ForegroundColor White  
    Write-Host "3. Allez dans SQL Editor" -ForegroundColor White
    Write-Host "4. Creez une New query" -ForegroundColor White
    Write-Host "5. Copiez le SQL ci-dessous" -ForegroundColor White
    Write-Host "6. Collez et cliquez sur Run" -ForegroundColor White
    Write-Host ""
    Write-Host "CONTENU SQL:" -ForegroundColor Cyan
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    Get-Content $sqlFile
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Copier le SQL dans le presse-papiers? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -match '^[Oo]$') {
        Get-Content $sqlFile -Raw | Set-Clipboard
        Write-Host "SQL copie dans le presse-papiers!" -ForegroundColor Green
    }
} else {
    Write-Host "Fichier SQL introuvable" -ForegroundColor Red
}
