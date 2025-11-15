# 🔌 Guide de Configuration MCP Supabase pour Claude Code

Ce guide vous permet de connecter Claude Code directement à votre base de données Supabase via MCP (Model Context Protocol).

## 📋 Prérequis

- ✅ npm installé (déjà fait - v10.9.4)
- ✅ node installé (déjà fait - v22.21.1)
- 🔑 Credentials Supabase (à récupérer)

---

## 🚀 Instructions Étape par Étape

### **Étape 1 : Récupérer vos Credentials Supabase**

1. Ouvrez votre projet Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** ⚙️ (en bas à gauche) → **API**
4. Notez ces informations :

   - **Project URL** : `https://xxxxxxxxxxxxx.supabase.co`
   - **Service Role Key** (anon key) : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...`

   > ⚠️ **IMPORTANT** : Utilisez la **service_role** key pour avoir accès complet au schéma
   >
   > ⚠️ **SÉCURITÉ** : Ne partagez JAMAIS cette clé publiquement !

---

### **Étape 2 : Créer un fichier .env (sécurisé)**

Créez un fichier `.env` à la racine du projet avec vos credentials :

```bash
# Dans /home/user/ALJ_Jonage_Escalade/.env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
```

> ℹ️ Le fichier `.env` est déjà dans `.gitignore`, il ne sera pas commité.

---

### **Étape 3 : Installer le serveur MCP Supabase**

Il existe plusieurs options pour le serveur MCP Supabase :

#### **Option A : Serveur MCP Supabase officiel (Recommandé)**

```bash
# Vérifier si le package existe
npm search @modelcontextprotocol/server-supabase
```

Si le package n'existe pas encore, utilisez l'Option B.

#### **Option B : Serveur MCP PostgreSQL (Alternative)**

Supabase utilise PostgreSQL, donc nous pouvons utiliser le serveur MCP PostgreSQL :

```bash
# Installer le serveur MCP PostgreSQL
npm install -g @modelcontextprotocol/server-postgres
```

---

### **Étape 4 : Configurer Claude Code**

Vous avez **deux méthodes** pour configurer MCP dans Claude Code :

#### **Méthode 1 : Édition Manuelle (Plus de contrôle)**

1. **Fermez Claude Code complètement**

2. **Éditez le fichier de configuration** :
   ```bash
   nano /root/.claude.json
   ```

3. **Ajoutez la configuration MCP** dans la section `mcpServers` du projet :

   ```json
   {
     "projects": {
       "/home/user/ALJ_Jonage_Escalade": {
         "mcpServers": {
           "supabase": {
             "command": "npx",
             "args": [
               "-y",
               "@modelcontextprotocol/server-postgres"
             ],
             "env": {
               "POSTGRES_CONNECTION_STRING": "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
             }
           }
         }
       }
     }
   }
   ```

   > 🔑 Remplacez `[PROJECT-REF]` et `[PASSWORD]` par vos vraies valeurs Supabase

4. **Sauvegardez** (Ctrl+O, Enter, Ctrl+X)

5. **Redémarrez Claude Code**

#### **Méthode 2 : Via l'Interface Claude Code (Plus simple)**

1. Ouvrez Claude Code
2. Allez dans **Settings** → **MCP Servers**
3. Cliquez sur **Add Server**
4. Configurez :
   - **Name** : `supabase`
   - **Command** : `npx`
   - **Args** : `-y @modelcontextprotocol/server-postgres`
   - **Environment Variables** :
     - `POSTGRES_CONNECTION_STRING` : Votre connection string Supabase

---

### **Étape 5 : Récupérer votre Connection String Supabase**

Pour PostgreSQL, vous avez besoin de la **Connection String** :

1. Allez dans Supabase → **Settings** → **Database**
2. Sous **Connection String** → Sélectionnez **Connection pooling**
3. Mode : **Transaction**
4. Copiez la chaîne qui ressemble à :
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

5. Remplacez `[PASSWORD]` par votre mot de passe de base de données

---

### **Étape 6 : Tester la Connexion**

Après redémarrage de Claude Code, testez :

1. Ouvrez une conversation avec Claude
2. Demandez : "Peux-tu lister les tables de ma base de données Supabase ?"
3. Si MCP est bien configuré, je devrais pouvoir interroger votre base !

---

## 🔧 Configuration Alternative : Serveur MCP Personnalisé

Si les serveurs MCP standards ne fonctionnent pas, vous pouvez créer un serveur MCP personnalisé :

### **Créer un serveur MCP simple**

1. **Créez un dossier pour le serveur** :
   ```bash
   mkdir -p /home/user/ALJ_Jonage_Escalade/mcp-supabase
   cd /home/user/ALJ_Jonage_Escalade/mcp-supabase
   ```

2. **Initialisez un projet Node** :
   ```bash
   npm init -y
   npm install @supabase/supabase-js dotenv
   ```

3. **Créez le serveur** (fichier `index.js`) - voir fichier séparé

4. **Configurez Claude Code** pour utiliser ce serveur local

---

## 📊 Que Pourra Faire Claude avec MCP Supabase ?

Une fois MCP configuré, je pourrai :

✅ **Lister toutes les tables** de votre base de données
✅ **Voir les colonnes** et leurs types pour chaque table
✅ **Lire les index** existants
✅ **Analyser les contraintes** (foreign keys, etc.)
✅ **Générer des scripts SQL corrects** basés sur le vrai schéma
✅ **Optimiser les requêtes** en fonction de la structure réelle

---

## 🆘 Dépannage

### Problème : "Cannot find module"

**Solution** : Installez le serveur MCP globalement
```bash
npm install -g @modelcontextprotocol/server-postgres
```

### Problème : "Connection refused"

**Solution** : Vérifiez votre connection string Supabase
- Assurez-vous d'utiliser le **Connection pooling** (port 6543)
- Vérifiez que le mot de passe est correct
- Vérifiez que l'IP est autorisée (Supabase → Settings → Database → Connection pooling)

### Problème : "MCP server not responding"

**Solution** :
1. Redémarrez complètement Claude Code
2. Vérifiez les logs : Claude Code → Help → Show Logs
3. Vérifiez que npm peut exécuter le serveur :
   ```bash
   npx @modelcontextprotocol/server-postgres --help
   ```

---

## 📝 Notes Importantes

- ⚠️ Le **service_role key** donne un accès complet à votre base de données
- 🔒 Ne committez JAMAIS vos credentials dans Git
- 🔄 Redémarrez Claude Code après toute modification de configuration MCP
- 💾 La configuration MCP est stockée dans `/root/.claude.json`

---

## ✅ Checklist de Configuration

- [ ] Credentials Supabase récupérés (URL + Service Role Key)
- [ ] Fichier `.env` créé (si nécessaire)
- [ ] Serveur MCP installé
- [ ] Configuration ajoutée à `/root/.claude.json`
- [ ] Claude Code redémarré
- [ ] Connexion testée avec Claude

---

## 🎯 Prochaine Étape

Une fois MCP configuré, demandez-moi :

> "Peux-tu analyser le schéma de ma base de données Supabase et corriger les scripts SQL d'optimisation ?"

Et je pourrai directement interroger votre base pour générer des scripts 100% corrects !

---

**Besoin d'aide ?** Suivez ces étapes dans l'ordre et n'hésitez pas à me demander de l'aide si vous bloquez quelque part.
