# ============================================
# Script de Nettoyage Post-Migration
# Sauvegarde et suppression des images locales
# ============================================

Write-Host "=== NETTOYAGE POST-MIGRATION ===" -ForegroundColor Cyan
Write-Host ""

# Chemins
$assetsPath = "C:\Users\a138672\Downloads\club-escalade-app\public\assets\members"
$backupPath = "C:\Users\a138672\Downloads\club-escalade-app\backups"
$backupFile = "$backupPath\members_photos_backup_$(Get-Date -Format 'yyyy-MM-dd').zip"

# ÉTAPE 1 : Créer le dossier de backup
Write-Host "1. Création du dossier backup..." -ForegroundColor Yellow
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "   ✅ Dossier backup créé" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dossier backup existe déjà" -ForegroundColor Green
}

# ÉTAPE 2 : Sauvegarder les images
Write-Host ""
Write-Host "2. Sauvegarde des images locales..." -ForegroundColor Yellow
if (Test-Path $assetsPath) {
    $files = Get-ChildItem -Path $assetsPath -File
    if ($files.Count -gt 0) {
        Compress-Archive -Path "$assetsPath\*" -DestinationPath $backupFile -Force
        Write-Host "   ✅ Backup créé : $backupFile" -ForegroundColor Green
        Write-Host "   📦 $($files.Count) fichier(s) sauvegardé(s)" -ForegroundColor Cyan
    } else {
        Write-Host "   ℹ️ Aucun fichier à sauvegarder" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️ Dossier source introuvable" -ForegroundColor Yellow
}

# ÉTAPE 3 : Retirer du tracking Git (sans supprimer les fichiers)
Write-Host ""
Write-Host "3. Retrait du tracking Git..." -ForegroundColor Yellow
Set-Location "C:\Users\a138672\Downloads\club-escalade-app"

try {
    git rm --cached -r public/assets/members/ 2>$null
    git rm --cached -r public/assets/passeports/ 2>$null
    Write-Host "   ✅ Images retirées du tracking Git" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️ Déjà retiré ou inexistant" -ForegroundColor Gray
}

# ÉTAPE 4 : Commit des changements
Write-Host ""
Write-Host "4. Commit du nettoyage..." -ForegroundColor Yellow
Write-Host "   Voulez-vous committer maintenant ? (o/n)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq 'o' -or $response -eq 'O') {
    git add .gitignore
    git commit -m "chore: suppression images du tracking Git après migration Supabase"
    git push origin main
    Write-Host "   ✅ Changements committés et pushés" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Commit annulé (à faire manuellement)" -ForegroundColor Gray
}

# ÉTAPE 5 : Supprimer les fichiers locaux (OPTIONNEL)
Write-Host ""
Write-Host "5. Suppression des fichiers locaux (OPTIONNEL)" -ForegroundColor Yellow
Write-Host "   ⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !" -ForegroundColor Red
Write-Host "   Voulez-vous supprimer les fichiers locaux ? (o/n)" -ForegroundColor Cyan
$deleteResponse = Read-Host

if ($deleteResponse -eq 'o' -or $deleteResponse -eq 'O') {
    if (Test-Path $assetsPath) {
        Remove-Item -Path "$assetsPath\*" -Recurse -Force
        Write-Host "   ✅ Fichiers locaux supprimés" -ForegroundColor Green
        Write-Host "   💾 Backup disponible : $backupFile" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ℹ️ Fichiers conservés localement" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== NETTOYAGE TERMINÉ ===" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé :" -ForegroundColor Cyan
Write-Host "- Backup : $backupFile"
Write-Host "- Git tracking : Retiré"
Write-Host "- Fichiers locaux : $(if ($deleteResponse -eq 'o') {'Supprimés'} else {'Conservés'})"
