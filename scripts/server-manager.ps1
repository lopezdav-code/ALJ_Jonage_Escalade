# Script PowerShell simple pour gerer le serveur de developpement
param(
    [string]$Action = "status"
)

$ProjectPath = "C:\Users\a138672\Downloads\club-escalade-app"
$ServerUrl = "http://localhost:3000/ALJ_Jonage_Escalade/"

function Test-ServerStatus {
    try {
        Invoke-WebRequest -Uri $ServerUrl -Method Head -TimeoutSec 3 -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Stop-DevServer {
    Write-Host "Arret du serveur..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
    Write-Host "Serveur arrete" -ForegroundColor Green
}

function Start-DevServer {
    Write-Host "Demarrage du serveur..." -ForegroundColor Cyan
    Set-Location $ProjectPath
    
    # Demarrer en arriere-plan
    Start-Process powershell -ArgumentList "-Command", "cd '$ProjectPath'; npm run dev" -WindowStyle Minimized
    
    # Attendre que le serveur demarre
    $attempts = 0
    do {
        Start-Sleep 3
        $attempts++
        Write-Host "   Tentative $attempts/10..." -ForegroundColor Gray
    } while (-not (Test-ServerStatus) -and $attempts -lt 10)
    
    if (Test-ServerStatus) {
        Write-Host "Serveur demarre avec succes!" -ForegroundColor Green
        Write-Host "URL: $ServerUrl" -ForegroundColor Blue
    } else {
        Write-Host "Echec du demarrage du serveur" -ForegroundColor Red
    }
}

# Actions principales
switch ($Action.ToLower()) {
    "status" {
        Write-Host "Verification du statut du serveur..." -ForegroundColor Cyan
        if (Test-ServerStatus) {
            Write-Host "Serveur actif sur $ServerUrl" -ForegroundColor Green
        } else {
            Write-Host "Serveur non accessible" -ForegroundColor Red
        }
    }
    "start" {
        if (Test-ServerStatus) {
            Write-Host "Serveur deja actif sur $ServerUrl" -ForegroundColor Green
        } else {
            Start-DevServer
        }
    }
    "stop" {
        Stop-DevServer
    }
    "restart" {
        Write-Host "Redemarrage du serveur..." -ForegroundColor Yellow
        Stop-DevServer
        Start-DevServer
    }
    default {
        Write-Host "Usage: .\server-manager.ps1 [status|start|stop|restart]" -ForegroundColor White
        Write-Host "  status  - Verifier le statut du serveur" -ForegroundColor Gray
        Write-Host "  start   - Demarrer le serveur" -ForegroundColor Gray  
        Write-Host "  stop    - Arreter le serveur" -ForegroundColor Gray
        Write-Host "  restart - Redemarrer le serveur" -ForegroundColor Gray
    }
}