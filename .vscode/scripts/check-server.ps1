if (-not (try { (Invoke-WebRequest -Uri 'http://localhost:3000/ALJ_Jonage_Escalade/' -Method Head -TimeoutSec 5 -ErrorAction Stop).StatusCode -eq 200 } catch { $false })) { 
    Write-Host 'Redémarrage du serveur...'
    Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
    Start-Process powershell -ArgumentList '-Command', 'cd "C:\Users\a138672\Downloads\club-escalade-app\"; npm run dev' -WindowStyle Hidden
    Start-Sleep 5
    Write-Host 'Serveur redémarré!' 
} else { 
    Write-Host 'Serveur déjà actif ✅' 
}