#!/bin/bash

# Script de déploiement vers la production
# Usage: ./deploy-to-production.sh "Message de commit"

set -e

echo "🚀 Déploiement vers la production..."

# Vérifier qu'on est sur develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "❌ Erreur: Vous devez être sur la branche 'develop'"
    exit 1
fi

# Vérifier que tout est commité
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Erreur: Il y a des changements non commités"
    git status
    exit 1
fi

# Message de commit (optionnel)
COMMIT_MESSAGE="${1:-Release from develop branch}"

echo "📦 Test du build..."
npm run build

echo "🔄 Passage sur main..."
git checkout main

echo "🔄 Récupération des dernières modifications..."
git pull origin main

echo "🔄 Merge de develop vers main..."
git merge develop --no-ff -m "$COMMIT_MESSAGE"

echo "📤 Push vers main (déclenchera le déploiement)..."
git push origin main

echo "🔄 Retour sur develop..."
git checkout develop

echo "✅ Déploiement lancé ! Vérifiez les Actions GitHub."
echo "🌐 Site: https://lopezdav-code.github.io/ALJ_Jonage_Escalade/"