# ✅ Configuration Vite - Variables d'environnement

## 🔧 Vérifier votre .env.local

Le scraper FFME a besoin des variables d'environnement Supabase configurées.

### Fichier: `.env.local`

Assurez-vous que vous avez:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 🔍 Où trouver ces valeurs

1. Allez sur: https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez: **Settings** (en bas à gauche)
4. Allez à: **API** 
5. Vous verrez:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 📝 Exemple complet

```env
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Redémarrer le serveur

Après modification du `.env.local`, **redémarrez** le serveur Vite:

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer:
npm run dev
```

## 🧪 Vérifier que ça fonctionne

Ouvrez la console du navigateur (F12) et exécutez:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```

Vous devriez voir votre URL Supabase.

## ✅ Après cette configuration

Le scraper devrait fonctionner correctement!

- ✅ Pas d'erreur "process is not defined"
- ✅ L'Edge Function peut être appelée
- ✅ Les données s'inscrivent en BDD
