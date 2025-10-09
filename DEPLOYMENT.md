# 🚀 Workflow de Développement et Déploiement

## 📋 Structure des Branches

- **`main`** → 🌐 Production (déploiement automatique sur GitHub Pages)
- **`develop`** → 🛠️ Développement (tests automatiques, pas de déploiement)
- **`feature/*`** → ✨ Branches de fonctionnalités

## 🔄 Workflow de Développement

### 1. Développement quotidien
```bash
# Travail sur la branche develop
git checkout develop
git pull origin develop

# Faire vos modifications...
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop
```

### 2. Nouvelle fonctionnalité
```bash
# Créer une branche feature
git checkout develop
git checkout -b feature/nouvelle-fonctionnalite

# Développer...
git add .
git commit -m "feat: implémentation nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request vers develop
```

### 3. Déploiement en production
```bash
# Option 1: Script automatique (Windows)
.\scripts\deploy-to-production.ps1 "v2.6.0: nouvelles fonctionnalités"

# Option 2: Manuel
git checkout develop
npm run build  # Test du build
git checkout main
git pull origin main
git merge develop --no-ff -m "Release v2.6.0"
git push origin main  # Déclenche le déploiement
git checkout develop
```

## 🤖 Actions GitHub

### Sur `develop` :
- ✅ Test du build automatique
- 📦 Génération des artifacts
- ❌ Pas de déploiement

### Sur `main` :
- ✅ Build de production
- 🚀 Déploiement automatique sur GitHub Pages
- 🌐 Site mis à jour

## 📁 Scripts Disponibles

- `scripts/deploy-to-production.ps1` - Déploiement Windows (PowerShell)
- `scripts/deploy-to-production.sh` - Déploiement Linux/Mac (Bash)

## 🔒 Bonnes Pratiques

1. **Jamais de commit direct sur `main`**
2. **Tests sur `develop` avant merge**
3. **Messages de commit explicites**
4. **Review des Pull Requests**
5. **Déploiement contrôlé et documenté**

## 🌐 URLs

- **Production** : https://lopezdav-code.github.io/ALJ_Jonage_Escalade/
- **Repository** : https://github.com/lopezdav-code/ALJ_Jonage_Escalade