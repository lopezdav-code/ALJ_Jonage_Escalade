# Script de déploiement vers la production (PowerShell)
# Usage: .\deploy-to-production.ps1 "Message de commit"

param(
    [string]$CommitMessage = "Release from develop branch"
)

Write-Host "🚀 Déploiement vers la production..." -ForegroundColor Green

# Vérifier qu'on est sur develop
$currentBranch = git branch --show-current
if ($currentBranch -ne "develop") {
    Write-Host "❌ Erreur: Vous devez être sur la branche 'develop'" -ForegroundColor Red
    exit 1
}

# Vérifier que tout est commité
$status = git status --porcelain
if ($status) {
    Write-Host "❌ Erreur: Il y a des changements non commités" -ForegroundColor Red
    git status
    exit 1
}

Write-Host "📦 Test du build..." -ForegroundColor Yellow
npm run build

Write-Host "🔄 Passage sur main..." -ForegroundColor Yellow
git checkout main

Write-Host "🔄 Récupération des dernières modifications..." -ForegroundColor Yellow
git pull origin main

Write-Host "🔄 Merge de develop vers main..." -ForegroundColor Yellow
git merge develop --no-ff -m $CommitMessage

Write-Host "📤 Push vers main (déclenchera le déploiement)..." -ForegroundColor Yellow
git push origin main

Write-Host "🔄 Retour sur develop..." -ForegroundColor Yellow
git checkout develop

Write-Host "✅ Déploiement lancé ! Vérifiez les Actions GitHub." -ForegroundColor Green
Write-Host "🌐 Site: https://lopezdav-code.github.io/ALJ_Jonage_Escalade/" -ForegroundColor Cyan