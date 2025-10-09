# 🚀 Guide de Démarrage Rapide du Serveur

## ⚡ Commandes Rapides

### Démarrage Standard
```bash
npm run dev
```
→ Démarre le serveur sur le premier port disponible (3000, 3001, 3002...)

### Gestion Automatisée (scripts personnalisés)
```bash
npm run server:status    # Vérifier si le serveur tourne
npm run server:start     # Démarrer le serveur  
npm run server:stop      # Arrêter le serveur
npm run server:restart   # Redémarrer le serveur
```

### Script de Surveillance Continue
```bash
npm run dev:auto         # Surveillance automatique avec redémarrage
```

## 🔧 Scripts Disponibles

### 1. Script de Gestion Principal
**Fichier :** `scripts/server-manager.ps1`
- Gestion complète du serveur (start/stop/restart/status)
- Détection automatique du port disponible
- Arrêt propre des processus Node.js

### 2. Script de Surveillance Continue  
**Fichier :** `scripts/auto-restart.js`
- Surveillance permanente du serveur
- Redémarrage automatique en cas de plantage
- Vérification toutes les 15 secondes

### 3. Script Batch Simple
**Fichier :** `scripts/restart-server.bat`
- Redémarrage simple pour Windows
- Interface utilisateur conviviale
- Vérification du statut avant action

## 🌐 URLs d'Accès

Selon le port attribué automatiquement :
- **Port 3000 :** http://localhost:3000/ALJ_Jonage_Escalade/
- **Port 3001 :** http://localhost:3001/ALJ_Jonage_Escalade/  
- **Port 3002 :** http://localhost:3002/ALJ_Jonage_Escalade/

## 🐛 Résolution de Problèmes

### Problème : Port déjà utilisé
**Solution :** Vite trouve automatiquement le prochain port disponible

### Problème : Serveur ne démarre pas
```bash
# 1. Arrêter tous les processus Node.js
taskkill /F /IM node.exe

# 2. Redémarrer
npm run dev
```

### Problème : Processus fantômes
```bash
# Utiliser le script de nettoyage
npm run server:stop
npm run server:start
```

## 📋 Checklist de Démarrage

1. ✅ **Ouvrir un terminal** dans le dossier du projet
2. ✅ **Exécuter** `npm run dev`
3. ✅ **Noter le port** affiché dans la sortie
4. ✅ **Ouvrir le navigateur** sur l'URL indiquée
5. ✅ **Vérifier** que l'application se charge correctement

## 🎯 Recommandations

### Pour le Développement Quotidien :
```bash
npm run dev
```

### Pour la Surveillance Continue :
```bash
npm run dev:auto
```

### Pour la Gestion Avancée :
```bash
npm run server:status
npm run server:restart
```

## 📝 Notes Importantes

- **Ports automatiques :** Vite sélectionne automatiquement un port libre
- **Processus en arrière-plan :** Utiliser `server:stop` pour arrêter proprement
- **Surveillance réseau :** Le serveur est accessible sur toutes les interfaces réseau
- **Hot Reload :** Les modifications sont automatiquement rechargées

---

💡 **Astuce :** Ajoutez ces commandes à vos favoris pour un accès rapide !