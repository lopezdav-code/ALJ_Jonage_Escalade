@echo off
REM Script batch pour redémarrer automatiquement le serveur de développement

echo Vérification du serveur de développement...

REM Tester si le serveur répond
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ALJ_Jonage_Escalade/ | findstr "200" >nul

if %errorlevel% equ 0 (
    echo ✅ Serveur déjà actif
    goto :end
)

echo ❌ Serveur non accessible - Redémarrage...

REM Arrêter tous les processus Node.js
taskkill /F /IM node.exe >nul 2>&1

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Changer vers le répertoire du projet
cd /d "C:\Users\a138672\Downloads\club-escalade-app"

REM Démarrer le serveur en arrière-plan
echo Démarrage du serveur...
start /min cmd /c "npm run dev"

REM Attendre que le serveur démarre
timeout /t 5 /nobreak >nul

echo ✅ Serveur redémarré!

:end
echo Terminé.