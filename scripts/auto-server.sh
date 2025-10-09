#!/bin/bash
# Script de surveillance et redémarrage automatique du serveur de développement

# Fonction pour vérifier si le serveur fonctionne
check_server() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ALJ_Jonage_Escalade/ 2>/dev/null)
    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction pour démarrer le serveur
start_server() {
    echo "$(date): Démarrage du serveur de développement..."
    cd /c/Users/a138672/Downloads/club-escalade-app
    npm run dev &
    SERVER_PID=$!
    echo "$(date): Serveur démarré avec PID $SERVER_PID"
}

# Fonction pour arrêter le serveur
stop_server() {
    echo "$(date): Arrêt du serveur..."
    taskkill //F //IM node.exe 2>/dev/null || true
    sleep 2
}

# Fonction principale de surveillance
monitor_server() {
    while true; do
        if check_server; then
            echo "$(date): Serveur OK ✅"
        else
            echo "$(date): Serveur non accessible - Redémarrage..."
            stop_server
            start_server
            sleep 5
        fi
        sleep 10  # Vérifier toutes les 10 secondes
    done
}

# Démarrage initial
echo "$(date): Démarrage de la surveillance du serveur..."
stop_server
start_server
sleep 5
monitor_server