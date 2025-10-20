# Mettre à jour `schema.json`

Ce document explique comment exécuter le script qui met à jour `schema.json` depuis la base Supabase, et quelles bonnes pratiques suivre pour protéger les secrets.

## Commande locale

Le script principal est `scripts/update-schema.js`. Pour l'exécuter localement :

```bash
# installez les dépendances si nécessaire
npm install

# exécute la fonction qui appelle l'Edge Function et écrit schema.json
npm run update-schema
```

Le script lit les variables d'environnement dans `.env.local` (fichier non committé) ou dans l'environnement système.

## Variables attendues

- `SUPABASE_URL` - l'URL de votre projet Supabase (ex: `https://...supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` - la Service Role Key de Supabase (clé sensible à garder secrète).

Exemple de `.env.local` (NE PAS COMMITTER ce fichier dans Git) :

```env
SUPABASE_URL=https://hvugiirundpxynozxxnd.supabase.co
SUPABASE_SERVICE_ROLE_KEY='eyJ...votre_service_role_key...'
```

Assurez-vous que `.env.local` est ignoré par Git (le repository contient `schema.json` dans `.gitignore`, mais vous devriez aussi ignorer `.env.local`).

## Sécuriser les secrets

1. Ne jamais committer de clés sensibles dans le dépôt. Vérifiez l'historique si une clé a été poussée (révoquez-la si nécessaire).
2. Pour les environnements partagés (CI / production) :
   - Stockez la Service Role Key dans le système de secrets du runner (GitHub Actions ``secrets``, GitLab CI variables, etc.).
   - Dans Supabase Functions, utilisez les variables d'environnement / secrets fournis par Supabase (Settings → Environment variables) — ne stockez pas la clé dans le code.
3. Rotation : Si une clé a été exposée, régénérez-la depuis le dashboard Supabase (`Settings → API`) et mettez à jour les secrets dans CI et les machines locales.
4. Moins de privilèges : si possible, évitez d'utiliser la Service Role Key partout. Utilisez-la uniquement là où c'est nécessaire (ex : création du schéma, tâches admin). Pour les appels en lecture, préférez une API plus limitée.

## Exécution automatisée (VS Code task)

Une tâche VS Code a été ajoutée (`.vscode/tasks.json`) pour exécuter `node scripts/update-schema.js` à l'ouverture du workspace. Si vous ne souhaitez pas un appel réseau automatique, éditez ou supprimez `runOn: "folderOpen"`.

## Vérifications après exécution

- `schema.json` est généré à la racine. Par défaut le repo ignore ce fichier via `.gitignore`. Si vous l'avez committé par erreur, pensez à le retirer du suivi (`git rm --cached schema.json`) puis committer.

## Que faire si la clé a été exposée

1. Révoquez / régénérez la clé depuis Supabase.
2. Remplacez la clé dans vos secrets CI / machines locales.
3. Si la clé a été poussée dans l'historique Git et doit être retirée, utilisez `git filter-repo` ou `bfg` (attention : réécriture d'historique).

---
Si vous voulez que j'ajoute un petit script pour chiffrer/décrypter les secrets localement (par ex. `gpg`), ou un exemple GitHub Actions qui utilise le secret pour exécuter `npm run update-schema`, dites-le moi et je l'ajoute.
