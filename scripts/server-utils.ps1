# Fonctions utilitaires pour la gestion automatique du serveur de développement

# Fonction pour vérifier si le serveur est accessible
function Test-DevServer {
    param(
        [string]$Url = "http://localhost:3000/ALJ_Jonage_Escalade/",
        [int]$TimeoutSeconds = 5
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Fonction pour redémarrer le serveur si nécessaire
function Restart-DevServerIfNeeded {
    param(
        [string]$ProjectPath = "C:\Users\a138672\Downloads\club-escalade-app"
    )
    
    Write-Host "Vérification du serveur de développement..." -ForegroundColor Cyan
    
    if (Test-DevServer) {
        Write-Host "✅ Serveur déjà accessible" -ForegroundColor Green
        return $true
    }
    
    Write-Host "❌ Serveur non accessible - Redémarrage..." -ForegroundColor Yellow
    
    # Arrêter tous les processus Node.js
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    catch {
        # Ignorer si aucun processus Node
    }
    
    # Démarrer le serveur
    Set-Location $ProjectPath
    Write-Host "Démarrage du serveur..." -ForegroundColor Green
    
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npm run dev
    } -ArgumentList $ProjectPath
    
    # Attendre que le serveur démarre
    $maxWait = 30
    $waited = 0
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        
        if (Test-DevServer) {
            Write-Host "✅ Serveur redémarré avec succès!" -ForegroundColor Green
            return $true
        }
        
        Write-Host "⏳ Attente du démarrage... ($waited/$maxWait secondes)" -ForegroundColor Yellow
    }
    
    Write-Host "❌ Échec du redémarrage du serveur" -ForegroundColor Red
    return $false
}

# Fonction pour surveiller et maintenir le serveur actif
function Start-DevServerWatcher {
    param(
        [string]$ProjectPath = "C:\Users\a138672\Downloads\club-escalade-app",
        [int]$CheckInterval = 30
    )
    
    Write-Host "🚀 Démarrage de la surveillance automatique du serveur" -ForegroundColor Cyan
    Write-Host "Vérification toutes les $CheckInterval secondes" -ForegroundColor Gray
    
    # Démarrage initial
    Restart-DevServerIfNeeded -ProjectPath $ProjectPath
    
    # Surveillance continue
    while ($true) {
        Start-Sleep -Seconds $CheckInterval
        
        if (-not (Test-DevServer)) {
            Write-Host "$(Get-Date): Serveur déconnecté - Redémarrage automatique..." -ForegroundColor Red
            Restart-DevServerIfNeeded -ProjectPath $ProjectPath
        } else {
            Write-Host "$(Get-Date): Serveur OK ✅" -ForegroundColor Green
        }
    }
}

Write-Host "Fonctions de gestion du serveur chargées:" -ForegroundColor Cyan
Write-Host "  - Test-DevServer" -ForegroundColor Gray
Write-Host "  - Restart-DevServerIfNeeded" -ForegroundColor Gray  
Write-Host "  - Start-DevServerWatcher" -ForegroundColor Gray
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  Restart-DevServerIfNeeded    # Redémarre si nécessaire" -ForegroundColor Gray
Write-Host "  Start-DevServerWatcher       # Surveillance continue" -ForegroundColor Gray