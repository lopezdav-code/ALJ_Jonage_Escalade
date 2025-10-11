# Guide des Rôles et Permissions

## 📊 Vue d'ensemble des rôles

L'application dispose de 6 niveaux de rôles hiérarchiques :

1. **Public** - Visiteurs non connectés
2. **User** - Utilisateurs connectés sans adhésion
3. **Adhérent** - Membres adhérents du club
4. **Bureau** - Membres du bureau avec accès à la gestion des adhérents
5. **Encadrant** - Encadrants avec accès pédagogique et séances
6. **Admin** - Administrateurs avec accès complet

---

## 🔐 Matrice des Permissions Spéciales

| Permission | Adhérent | Bureau | Encadrant | Admin |
|-----------|----------|--------|-----------|-------|
| **Voir le nom de famille en entier** | ❌ | ✅ | ✅ | ✅ |
| **Éditer la fiche d'un membre** | ❌ | ✅ | ❌ | ✅ |
| **Supprimer un membre** | ❌ | ❌ | ❌ | ✅ |
| **Accéder aux logs de connexion** | ❌ | ❌ | ❌ | ✅ |
| **Gestion des rôles & accès** | ❌ | ❌ | ❌ | ✅ |
| **Ajouter une fiche pédagogique** | ❌ | ❌ | ✅ | ✅ |
| **Créer/modifier une compétition** | ❌ | ❌ | ✅ | ✅ |

---

## 📱 Accès aux Pages

### Pages publiques (tous les rôles)
- ✅ Actualités
- ✅ Planning
- ✅ Inscription
- ✅ Contact
- ✅ Compétitions
- ✅ Agenda

### Pages réservées aux adhérents et plus
- ✅ Bénévoles
- ✅ Adhérents (consultation uniquement pour adhérent)
- ✅ Compétiteurs
- ✅ Support Pédagogique

### Pages Bureau
- ✅ Adhérents (modification autorisée)
- ✅ Compétiteurs (consultation)

### Pages Encadrants et Admins
- ✅ Séances (historique)
- ✅ Cycles (gestion)
- ✅ Validation Passeports
- ✅ Support Pédagogique (ajout de fiches)
- ✅ Compétitions (création/modification)

### Pages Admin uniquement
- ✅ Réglages du site
- ✅ Gestion des rôles
- ✅ Logs de connexion

---

## 👤 Détails par Rôle

### 🌐 Public
**Accès :**
- Consultation des actualités
- Consultation du planning
- Formulaire d'inscription
- Page de contact
- Liste des compétitions
- Agenda

**Restrictions :**
- Aucune modification possible
- Pas d'accès aux données des membres
- Pas d'accès aux outils de gestion

---

### 🔓 User (Utilisateur connecté)
**Accès supplémentaires :**
- Profil utilisateur personnel
- Changement de mot de passe

**Restrictions :**
- Mêmes restrictions que Public
- Pas d'accès aux données sensibles

---

### 🎯 Adhérent
**Accès supplémentaires :**
- Page Adhérents (noms partiels uniquement)
- Page Compétiteurs
- Page Bénévoles
- Support Pédagogique (consultation)
- Historique des séances (consultation)

**Restrictions :**
- ❌ Ne peut pas voir les noms de famille complets
- ❌ Ne peut pas modifier les fiches membres
- ❌ Ne peut pas créer de contenu pédagogique
- ❌ Ne peut pas gérer les séances ou cycles

---

### 🏢 Bureau
**Accès supplémentaires :**
- ✅ Voir les noms de famille complets
- ✅ Éditer les fiches membres (ajout, modification)
- ✅ Voir les informations de contact (téléphone, email)

**Cas d'usage :**
- Gestion administrative des adhésions
- Mise à jour des coordonnées
- Suivi des contacts d'urgence
- Gestion des licences

**Restrictions :**
- ❌ Ne peut pas supprimer de membres
- ❌ Pas d'accès aux fonctions pédagogiques
- ❌ Pas d'accès aux séances et cycles
- ❌ Pas d'accès admin

---

### 🧗 Encadrant
**Accès supplémentaires :**
- ✅ Voir les noms de famille complets
- ✅ Créer et modifier des séances
- ✅ Gérer les cycles de séances
- ✅ Valider les passeports
- ✅ Ajouter des fiches pédagogiques
- ✅ Créer et modifier des compétitions

**Cas d'usage :**
- Gestion pédagogique du club
- Suivi des progressions (passeports)
- Organisation des séances
- Création de contenus pédagogiques

**Restrictions :**
- ❌ Ne peut pas modifier les fiches membres
- ❌ Ne peut pas supprimer de membres
- ❌ Pas d'accès aux paramètres du site
- ❌ Pas d'accès à la gestion des rôles

---

### 👑 Admin
**Accès complet :**
- ✅ Toutes les permissions
- ✅ Réglages du site (logo, informations)
- ✅ Gestion des utilisateurs et rôles
- ✅ Configuration des accès aux pages
- ✅ Logs de connexion
- ✅ Suppression de membres
- ✅ Toutes les fonctions Bureau + Encadrant

**Responsabilités :**
- Configuration globale de l'application
- Attribution des rôles
- Sécurité et contrôle d'accès
- Maintenance technique

---

## 🔧 Configuration des Accès

### Via l'interface Admin Management

1. **Gestion des Rôles Utilisateurs**
   - Attribution du rôle à un utilisateur
   - Création de nouveaux comptes
   - Liaison avec un profil membre

2. **Configuration des Accès aux Pages**
   - Tableau avec checkboxes par rôle
   - Configuration sauvegardée en base de données
   - Application immédiate après sauvegarde

3. **Tableau des Permissions Spéciales**
   - Référence visuelle (lecture seule)
   - Documentation des droits codés en dur
   - Aide à la décision pour l'attribution des rôles

---

## 🚀 Implémentation Technique

### Contexte d'authentification (`SupabaseAuthContext.jsx`)

```javascript
const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);
const isEncadrant = useMemo(() => ['encadrant', 'admin'].includes(profile?.role), [profile]);
const isAdherent = useMemo(() => ['adherent', 'encadrant', 'admin'].includes(profile?.role), [profile]);
const isBureau = useMemo(() => ['bureau', 'admin'].includes(profile?.role), [profile]);
```

### Protection des routes

```javascript
// Example dans Members.jsx
const showAdminFeatures = !authLoading && (isAdmin || isBureau); // Peut éditer
const canDelete = !authLoading && isAdmin; // Peut supprimer
```

### Filtrage du menu

```javascript
// Dans Navigation.jsx
const userRole = isAdmin ? 'admin' : 
                 (isEncadrant ? 'encadrant' : 
                 (isBureau ? 'bureau' : 
                 (isAdherent ? 'adherent' : 
                 (user ? 'user' : 'public'))));

const filteredNavLinks = navLinks.filter(link => link.roles.includes(userRole));
```

---

## 📝 Bonnes Pratiques

### Attribution des rôles

1. **Adhérent** : Membres du club consultant les informations
2. **Bureau** : Membres du bureau gérant l'administratif
3. **Encadrant** : Encadrants gérant la pédagogie et les séances
4. **Admin** : 1-2 personnes maximum, responsables techniques

### Sécurité

- Les permissions sont vérifiées côté serveur (RLS Supabase)
- Le frontend masque seulement l'interface
- Toujours tester les accès après attribution de rôle
- Logs de connexion pour audit (admins uniquement)

### Évolutions futures

Pour ajouter une nouvelle permission :
1. Modifier le contexte d'authentification si nécessaire
2. Ajouter la logique dans les composants concernés
3. Mettre à jour la documentation
4. Ajouter une ligne dans le tableau des permissions spéciales

---

## ❓ FAQ

**Q : Un Bureau peut-il devenir Encadrant ?**
R : Oui, un admin peut changer le rôle d'un utilisateur. Les rôles sont exclusifs (un seul rôle par utilisateur).

**Q : Comment donner accès temporaire à une page ?**
R : Via "Gestion des Rôles" → "Accès aux Pages du Menu" → Cocher le rôle souhaité → Sauvegarder

**Q : Les permissions sont-elles sécurisées ?**
R : Oui, en plus du filtrage frontend, les RLS (Row Level Security) Supabase protègent les données au niveau base de données.

**Q : Peut-on avoir plusieurs admins ?**
R : Oui, mais il est recommandé de limiter à 1-2 admins pour la sécurité.

**Q : Un Encadrant peut-il modifier les membres ?**
R : Non, seuls Bureau et Admin peuvent modifier les fiches membres. L'Encadrant se concentre sur la pédagogie.

---

## 📞 Support

Pour toute question sur les rôles et permissions :
1. Consulter ce guide
2. Tester dans un environnement de développement
3. Contacter l'administrateur technique

---

*Dernière mise à jour : Octobre 2025*
