# Script PowerShell de surveillance et redémarrage automatique du serveur de développement

$ProjectPath = "C:\Users\a138672\Downloads\club-escalade-app"
$ServerUrl = "http://localhost:3000/ALJ_Jonage_Escalade/"
$CheckInterval = 10  # secondes

# Fonction pour vérifier si le serveur fonctionne
function Test-Server {
    try {
        $response = Invoke-WebRequest -Uri $ServerUrl -Method Head -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Fonction pour arrêter tous les processus Node.js
function Stop-Server {
    Write-Host "$(Get-Date): Arrêt du serveur..." -ForegroundColor Yellow
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    catch {
        # Ignorer les erreurs si aucun processus Node n'est trouvé
    }
}

# Fonction pour démarrer le serveur
function Start-Server {
    Write-Host "$(Get-Date): Démarrage du serveur de développement..." -ForegroundColor Green
    Set-Location $ProjectPath
    
    # Démarrer le serveur en arrière-plan
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npm run dev
    } -ArgumentList $ProjectPath
    
    Start-Sleep -Seconds 5
    Write-Host "$(Get-Date): Serveur démarré (Job ID: $($job.Id))" -ForegroundColor Green
    return $job
}

# Fonction principale de surveillance
function Start-ServerMonitoring {
    Write-Host "$(Get-Date): Démarrage de la surveillance automatique du serveur..." -ForegroundColor Cyan
    Write-Host "Appuyez sur Ctrl+C pour arrêter la surveillance" -ForegroundColor Yellow
    
    # Arrêt et démarrage initial
    Stop-Server
    $serverJob = Start-Server
    
    while ($true) {
        try {
            if (Test-Server) {
                Write-Host "$(Get-Date): Serveur OK ✅" -ForegroundColor Green
            }
            else {
                Write-Host "$(Get-Date): Serveur non accessible - Redémarrage..." -ForegroundColor Red
                
                # Nettoyer l'ancien job
                if ($serverJob) {
                    Stop-Job $serverJob -ErrorAction SilentlyContinue
                    Remove-Job $serverJob -ErrorAction SilentlyContinue
                }
                
                Stop-Server
                $serverJob = Start-Server
            }
            
            Start-Sleep -Seconds $CheckInterval
        }
        catch {
            Write-Host "$(Get-Date): Erreur dans la surveillance: $($_.Exception.Message)" -ForegroundColor Red
            Start-Sleep -Seconds 5
        }
    }
}

# Gestion de l'interruption Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Host "`n$(Get-Date): Arrêt de la surveillance..." -ForegroundColor Yellow
    Stop-Server
}

# Démarrage de la surveillance
Start-ServerMonitoring