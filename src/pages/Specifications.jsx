import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText, Database, GitBranch, Users, Settings, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MermaidDiagram from '@/components/ui/mermaid-diagram';

const Specifications = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Pages data with database operations
  const pagesData = [
    {
      name: "AccessLogs",
      route: "/access-logs",
      description: "Affiche les logs d'accès aux pages par les utilisateurs",
      auth: "Admin",
      tables: ["access_logs", "profiles"],
      operations: "SELECT",
      category: "Administration"
    },
    {
      name: "AdminDashboard",
      route: "/admin-dashboard",
      description: "Tableau de bord principal pour les administrateurs avec statistiques",
      auth: "Admin",
      tables: ["members", "competitions", "sessions", "profiles"],
      operations: "SELECT",
      category: "Administration"
    },
    {
      name: "AdminManagement",
      route: "/user-roles",
      description: "Gestion des utilisateurs et création de comptes admin",
      auth: "Admin",
      tables: ["profiles"],
      operations: "SELECT, Edge Functions",
      category: "Administration"
    },
    {
      name: "Agenda",
      route: "/agenda",
      description: "Affichage public du calendrier/planning",
      auth: "Public",
      tables: ["schedules", "groupe"],
      operations: "SELECT",
      category: "Public"
    },
    {
      name: "AnnualSummary",
      route: "/annual-summary",
      description: "Statistiques annuelles du club",
      auth: "Adherent",
      tables: ["members", "competitions", "sessions"],
      operations: "SELECT",
      category: "Statistiques"
    },
    {
      name: "AttendanceRecap",
      route: "/attendance-recap",
      description: "Suivi et récapitulatif des présences",
      auth: "Encadrant/Admin",
      tables: ["sessions", "schedules"],
      operations: "SELECT",
      category: "Gestion"
    },
    {
      name: "AuthorizationManagement",
      route: "/authorization-management",
      description: "Gestion des autorisations parentales et permissions",
      auth: "Admin",
      tables: ["parental_authorizations"],
      operations: "SELECT, INSERT, UPDATE, DELETE",
      category: "Administration"
    },
    {
      name: "BureauManagement",
      route: "/bureau-management",
      description: "Gestion des membres du bureau du club",
      auth: "Admin",
      tables: ["bureau", "members"],
      operations: "SELECT, INSERT, UPDATE, DELETE",
      category: "Administration"
    },
    {
      name: "CompetitionDetail",
      route: "/competitions/:id",
      description: "Affichage détaillé d'une compétition spécifique",
      auth: "Public",
      tables: ["competitions", "competition_participants", "competition_results", "members"],
      operations: "SELECT",
      category: "Compétitions"
    },
    {
      name: "CompetitionEditor",
      route: "/competitions/edit/:id",
      description: "Création et édition de compétitions",
      auth: "Admin/Encadrant",
      tables: ["competitions", "Storage"],
      operations: "SELECT, INSERT, UPDATE, Storage",
      category: "Compétitions"
    },
    {
      name: "CompetitionParticipants",
      route: "/competitions/:id/participants",
      description: "Gestion des participants à une compétition",
      auth: "Admin/Encadrant",
      tables: ["members", "competition_participants"],
      operations: "SELECT, INSERT, DELETE",
      category: "Compétitions"
    },
    {
      name: "CompetitionResultsEditor",
      route: "/competitions/:id/results",
      description: "Édition des résultats de compétition",
      auth: "Admin/Encadrant",
      tables: ["competition_results"],
      operations: "SELECT, INSERT, UPDATE, DELETE",
      category: "Compétitions"
    },
    {
      name: "Competitions",
      route: "/competitions",
      description: "Liste de toutes les compétitions",
      auth: "Public",
      tables: ["competitions"],
      operations: "SELECT",
      category: "Compétitions"
    },
    {
      name: "CompetitionsSummary",
      route: "/competitions-summary",
      description: "Statistiques résumées des compétitions",
      auth: "Adherent",
      tables: ["competitions", "competition_participants", "competition_results"],
      operations: "SELECT",
      category: "Statistiques"
    },
    {
      name: "CompetitorSummary",
      route: "/competitor-summary/:id",
      description: "Statistiques individuelles d'un compétiteur",
      auth: "Adherent",
      tables: ["members", "competition_participants", "competition_results", "competitions"],
      operations: "SELECT",
      category: "Statistiques"
    },
    {
      name: "ConnectionLogs",
      route: "/connection-logs",
      description: "Affichage des logs de connexion utilisateur",
      auth: "Admin",
      tables: ["connection_logs", "profiles"],
      operations: "SELECT",
      category: "Administration"
    },
    {
      name: "Contact",
      // route: "/contact",
      description: "Page de contact publique avec formulaire et carte",
      auth: "Public",
      tables: [],
      operations: "Aucun",
      category: "Public"
    },
    {
      name: "CycleDetail",
      route: "/cycles/:id",
      description: "Affichage détaillé d'un cycle d'entraînement avec sessions",
      auth: "Adherent (vue), Admin/Encadrant (édition)",
      tables: ["cycles", "sessions", "members", "Storage"],
      operations: "SELECT, UPDATE, INSERT, Storage",
      category: "Pédagogie"
    },
    {
      name: "CycleManagement",
      route: "/cycles",
      description: "Gestion des cycles d'entraînement (CRUD)",
      auth: "Adherent (vue), Admin/Encadrant (gestion)",
      tables: ["cycles", "sessions", "Storage"],
      operations: "SELECT, INSERT, UPDATE (soft delete), Storage",
      category: "Pédagogie"
    },
    {
      name: "DatabaseManagement",
      route: "/database-management",
      description: "Page de documentation de l'architecture de la base de données",
      auth: "Admin",
      tables: [],
      operations: "Documentation uniquement",
      category: "Administration"
    },
    {
      name: "DatabaseSchema",
      route: "/database-schema",
      description: "Affichage du schéma de la base de données",
      auth: "Protected",
      tables: ["information_schema"],
      operations: "RPC get_schema_info()",
      category: "Administration"
    },
    {
      name: "ExerciseProgress",
      route: "/exercise-progress",
      description: "Suivi de la progression des exercices pédagogiques par groupe",
      auth: "Encadrant",
      tables: ["schedules", "pedagogy_sheets", "sessions", "exercises"],
      operations: "SELECT (requêtes complexes)",
      category: "Pédagogie"
    },
    {
      name: "GroupeAdmin",
      route: "/groupe-admin",
      description: "Gestion des groupes (catégories et sous-catégories)",
      auth: "Admin",
      tables: ["groupe"],
      operations: "SELECT, INSERT, UPDATE, DELETE",
      category: "Administration"
    },
    {
      name: "ImageAdmin",
      route: "/image-admin",
      description: "Gestion des images du storage et liaison avec les membres",
      auth: "Admin",
      tables: ["secure_members", "members", "Storage"],
      operations: "SELECT, UPDATE (photo_url), Storage",
      category: "Administration"
    },
    {
      name: "Inscriptions",
      route: "/inscriptions",
      description: "Page publique d'information sur les inscriptions au club",
      auth: "Public",
      tables: [],
      operations: "Aucun",
      category: "Public"
    },
    {
      name: "InscriptionsSummary",
      route: "/inscriptions-summary",
      description: "Récapitulatif des inscriptions aux compétitions",
      auth: "Adherent",
      tables: ["competitions", "competition_participants"],
      operations: "SELECT",
      category: "Statistiques"
    },
    {
      name: "Login",
      route: "/login",
      description: "Page de connexion utilisateur",
      auth: "Public",
      tables: [],
      operations: "Supabase Auth signIn",
      category: "Authentification"
    },
    {
      name: "MemberEdit",
      route: "/members/:id/edit",
      description: "Édition des informations d'un membre",
      auth: "Admin/Bureau",
      tables: ["members", "Storage"],
      operations: "SELECT, UPDATE, Storage",
      category: "Membres"
    },
    {
      name: "MemberView",
      route: "/members/:id",
      description: "Visualisation détaillée d'un membre",
      auth: "Protected",
      tables: ["members", "competition_participants", "sessions", "parental_authorizations", "bureau"],
      operations: "SELECT (vue complète)",
      category: "Membres"
    },
    {
      name: "News",
      route: "/news",
      description: "Liste et gestion des actualités",
      auth: "Public (vue), Admin (gestion)",
      tables: ["news", "Storage"],
      operations: "SELECT, UPDATE (status), DELETE, Storage",
      category: "Public"
    },
    {
      name: "NewsDetail",
      route: "/news/:id",
      description: "Vue détaillée d'une actualité avec galerie photo",
      auth: "Public (vue), Admin (édition)",
      tables: ["news", "Storage"],
      operations: "SELECT, UPDATE, Storage",
      category: "Public"
    },
    {
      name: "news_edit",
      route: "/news/edit/:id",
      description: "Éditeur pour créer/modifier des actualités",
      auth: "Admin",
      tables: ["news", "competitions", "Storage"],
      operations: "SELECT, INSERT, UPDATE, Storage",
      category: "Public"
    },
    {
      name: "Pedagogy",
      route: "/pedagogy",
      description: "Liste des fiches pédagogiques",
      auth: "Encadrant",
      tables: ["pedagogy_sheets", "Storage"],
      operations: "SELECT, DELETE, Storage",
      category: "Pédagogie"
    },
    {
      name: "PedagogyEditor",
      route: "/pedagogy/edit/:id",
      description: "Création et édition de fiches pédagogiques",
      auth: "Encadrant",
      tables: ["pedagogy_sheets", "Storage"],
      operations: "SELECT, INSERT, UPDATE, Storage",
      category: "Pédagogie"
    },
    {
      name: "PasseportGuide",
      route: "/passeport-guide",
      description: "Guide des passeports d'escalade",
      auth: "Public",
      tables: [],
      operations: "Aucun",
      category: "Public"
    },
    {
      name: "PasseportValidation",
      route: "/passeport-validation",
      description: "Validation des passeports d'escalade",
      auth: "Encadrant",
      tables: ["passeport_validations", "members"],
      operations: "SELECT, INSERT, UPDATE, DELETE",
      category: "Pédagogie"
    },
    {
      name: "PasseportViewer",
      route: "/passeport-viewer",
      description: "Visualisation de la progression du passeport d'escalade",
      auth: "Adherent",
      tables: ["passeport_validations", "members"],
      operations: "SELECT",
      category: "Pédagogie"
    },
    {
      name: "Permissions",
      route: "/permissions",
      description: "Gestion des permissions granulaires par rôle",
      auth: "Admin",
      tables: ["config"],
      operations: "SELECT, UPDATE (permissions_config)",
      category: "Administration"
    },
    {
      name: "Schedule",
      route: "/schedule",
      description: "Affichage public du planning",
      auth: "Public (vue), Admin (gestion)",
      tables: ["schedules", "members"],
      operations: "SELECT",
      category: "Public"
    },
    {
      name: "ScheduleAdmin",
      route: "/schedule-admin",
      description: "Gestion des entrées du planning",
      auth: "Admin",
      tables: ["schedules", "groupe", "members"],
      operations: "SELECT, DELETE",
      category: "Administration"
    },
    {
      name: "ScheduleEdit",
      route: "/schedule/edit/:id",
      description: "Création/édition de créneaux horaires",
      auth: "Admin",
      tables: ["schedules", "groupe", "secure_members"],
      operations: "SELECT, INSERT, UPDATE",
      category: "Administration"
    },
    {
      name: "SessionCommentsEdit",
      route: "/sessions/:id/comments",
      description: "Édition des commentaires étudiants pour une session",
      auth: "Encadrant",
      tables: ["sessions", "members", "student_session_comments"],
      operations: "SELECT, DELETE, INSERT",
      category: "Gestion"
    },
    {
      name: "SessionEdit",
      route: "/sessions/edit/:id",
      description: "Création et édition de sessions d'entraînement",
      auth: "Admin",
      tables: ["sessions", "exercises", "cycles", "schedules", "Storage"],
      operations: "SELECT, INSERT, UPDATE, DELETE, Storage",
      category: "Gestion"
    },
    {
      name: "SessionLog",
      route: "/session-log",
      description: "Liste et filtrage des sessions d'entraînement",
      auth: "Encadrant/Adherent (vue), Admin (édition)",
      tables: ["sessions", "exercises", "cycles", "schedules", "secure_members"],
      operations: "SELECT, DELETE",
      category: "Gestion"
    },
    {
      name: "SessionLogDetail",
      route: "/sessions/:id",
      description: "Vue détaillée d'une session d'entraînement",
      auth: "Protected",
      tables: ["sessions", "exercises", "cycles", "schedules", "members", "student_session_comments", "pedagogy_sheets"],
      operations: "SELECT",
      category: "Gestion"
    },
    {
      name: "Setup",
      route: "/setup",
      description: "Initialisation de la configuration des buckets de storage",
      auth: "Admin",
      tables: ["Storage"],
      operations: "Storage bucket operations",
      category: "Administration"
    },
    {
      name: "SiteSettings",
      route: "/site-settings",
      description: "Gestion des paramètres globaux du site",
      auth: "Admin",
      tables: ["config", "Storage"],
      operations: "SELECT, UPDATE (config), Storage",
      category: "Administration"
    },
    {
      name: "UserRoles",
      route: "/user-roles",
      description: "Gestion des rôles et comptes utilisateur",
      auth: "Admin",
      tables: ["profiles", "members"],
      operations: "SELECT, UPDATE, Edge Functions",
      category: "Administration"
    },
    {
      name: "Volunteers",
      route: "/volunteers",
      description: "Gestion des membres du club par catégorie",
      auth: "Protected (vue), Admin/Bureau (édition)",
      tables: ["secure_members"],
      operations: "SELECT",
      category: "Membres"
    }
  ];

  // Database schema
  const databaseTables = [
    {
      name: "members / secure_members",
      description: "Informations des membres (secure_members est une vue avec RLS)",
      columns: "id, first_name, last_name, sexe, category, title, sub_group, groupe_id, email, phone, photo_url, brevet_federaux, emergency_contact_1_id, emergency_contact_2_id",
      type: "Core"
    },
    {
      name: "profiles",
      description: "Profils d'authentification utilisateur",
      columns: "id (UUID), role, member_id, email, email_confirmed_at",
      type: "Core"
    },
    {
      name: "sessions",
      description: "Sessions d'entraînement",
      columns: "id, date, start_time, session_objective, equipment, comment, schedule_id, cycle_id, instructors (array), students (array), absent_students (array), order",
      type: "Core"
    },
    {
      name: "exercises",
      description: "Détails des exercices pour les sessions",
      columns: "id, session_id, operational_objective, situation, organisation, consigne, time, success_criteria, regulation, support_link, image_url, pedagogy_sheet_id, order",
      type: "Core"
    },
    {
      name: "schedules",
      description: "Planning hebdomadaire/emploi du temps",
      columns: "id, Groupe, type, age_category, day, start_time, end_time, instructor_1_id, instructor_2_id, instructor_3_id, instructor_4_id",
      type: "Core"
    },
    {
      name: "groupe",
      description: "Catégories et sous-catégories de groupes",
      columns: "id, category, sous_category, Groupe_schedule",
      type: "Core"
    },
    {
      name: "cycles",
      description: "Cycles d'entraînement",
      columns: "id, name, short_description, is_active, created_at, updated_at",
      type: "Core"
    },
    {
      name: "pedagogy_sheets",
      description: "Fiches pédagogiques d'exercices",
      columns: "id, title, sheet_type, categories, [champs pédagogiques additionnels], created_at, updated_at",
      type: "Core"
    },
    {
      name: "competitions",
      description: "Informations sur les compétitions",
      columns: "id, title, date, location, description, image_url, competition_type, status, created_at, updated_at",
      type: "Compétitions"
    },
    {
      name: "competition_participants",
      description: "Participants aux compétitions",
      columns: "id, competition_id, member_id, category, registration_date",
      type: "Compétitions"
    },
    {
      name: "competition_results",
      description: "Résultats/classements des compétitions",
      columns: "id, competition_id, member_id, rank, score, category",
      type: "Compétitions"
    },
    {
      name: "parental_authorizations",
      description: "Enregistrements de consentement parental",
      columns: "id, member_id, authorization_type, granted, date, notes",
      type: "Autorisations"
    },
    {
      name: "bureau",
      description: "Membres du bureau",
      columns: "id, member_id, role, start_date, end_date",
      type: "Autorisations"
    },
    {
      name: "access_logs",
      description: "Suivi des accès aux pages",
      columns: "id, user_id, page, timestamp, ip_address",
      type: "Logs"
    },
    {
      name: "connection_logs",
      description: "Suivi des connexions",
      columns: "id, user_id, login_time, logout_time, ip_address",
      type: "Logs"
    },
    {
      name: "passeport_validations",
      description: "Validations des passeports d'escalade",
      columns: "id, member_id, level, skill, validated_by, validation_date",
      type: "Progression"
    },
    {
      name: "student_session_comments",
      description: "Commentaires sur les performances des étudiants",
      columns: "id, session_id, member_id, comment, created_by, created_at",
      type: "Progression"
    },
    {
      name: "config",
      description: "Configuration globale du site",
      columns: "id, key, value, description, updated_at",
      type: "Configuration"
    },
    {
      name: "news",
      description: "Actualités/annonces",
      columns: "id, title, short_description, content, date, theme, image_url, document_url, is_pinned, is_private, status, competition_id, created_at, updated_at",
      type: "Configuration"
    }
  ];

  // User flows
  const userFlows = [
    {
      name: "Gestion des Membres",
      steps: [
        { step: 1, action: "Admin crée un compte utilisateur", page: "UserRoles" },
        { step: 2, action: "Liaison avec le profil membre", page: "UserRoles" },
        { step: 3, action: "Admin/Bureau édite les détails du membre", page: "MemberEdit" },
        { step: 4, action: "Membres visualisent leurs propres détails", page: "MemberView" },
        { step: 5, action: "Navigation des membres par catégorie", page: "Volunteers" }
      ]
    },
    {
      name: "Gestion des Sessions",
      steps: [
        { step: 1, action: "Admin crée une session d'entraînement", page: "SessionEdit" },
        { step: 2, action: "Liaison de la session au planning/cycle", page: "SessionEdit" },
        { step: 3, action: "Ajout d'exercices depuis les fiches pédagogiques", page: "SessionEdit" },
        { step: 4, action: "Encadrant visualise les sessions", page: "SessionLog" },
        { step: 5, action: "Encadrant ajoute des commentaires étudiants", page: "SessionCommentsEdit" },
        { step: 6, action: "Visualisation des détails de session", page: "SessionLogDetail" }
      ]
    },
    {
      name: "Flux Compétition",
      steps: [
        { step: 1, action: "Admin/Encadrant crée une compétition", page: "CompetitionEditor" },
        { step: 2, action: "Ajout des participants", page: "CompetitionParticipants" },
        { step: 3, action: "Enregistrement des résultats", page: "CompetitionResultsEditor" },
        { step: 4, action: "Le public visualise les compétitions", page: "Competitions, CompetitionDetail" },
        { step: 5, action: "Les membres visualisent les statistiques", page: "CompetitionsSummary, CompetitorSummary" }
      ]
    },
    {
      name: "Flux Pédagogie",
      steps: [
        { step: 1, action: "Encadrant crée une fiche pédagogique", page: "PedagogyEditor" },
        { step: 2, action: "Navigation dans la bibliothèque pédagogique", page: "Pedagogy" },
        { step: 3, action: "Utilisation des fiches dans les sessions", page: "SessionEdit" },
        { step: 4, action: "Suivi de la progression par groupe", page: "ExerciseProgress" }
      ]
    },
    {
      name: "Flux Passeport (Certification)",
      steps: [
        { step: 1, action: "Les membres consultent le guide du passeport", page: "PasseportGuide" },
        { step: 2, action: "Encadrant valide les compétences", page: "PasseportValidation" },
        { step: 3, action: "Les membres suivent leur progression", page: "PasseportViewer" }
      ]
    },
    {
      name: "Gestion des Cycles",
      steps: [
        { step: 1, action: "Admin/Encadrant crée un cycle", page: "CycleManagement" },
        { step: 2, action: "Ajout de sessions au cycle", page: "CycleDetail" },
        { step: 3, action: "Liaison de documents/ressources", page: "CycleDetail" },
        { step: 4, action: "Les membres visualisent le contenu du cycle", page: "CycleDetail" }
      ]
    }
  ];

  // Architecture diagram (Mermaid syntax)
  const architectureDiagram = `graph TB
    subgraph "Couche Présentation"
        A[React Components]
        B[Pages JSX]
        C[UI Components]
    end

    subgraph "Couche Authentification"
        D[SupabaseAuthContext]
        E[ProtectedRoute]
        F[useAuth Hook]
    end

    subgraph "Couche Logique"
        G[Custom Hooks]
        H[Context Providers]
        I[Utility Functions]
    end

    subgraph "Couche Données"
        J[Supabase Client]
        K[Storage Utils]
        L[API Calls]
    end

    subgraph "Backend Supabase"
        M[(PostgreSQL)]
        N[Row Level Security]
        O[Edge Functions]
        P[Storage Buckets]
    end

    A --> D
    B --> E
    A --> G
    B --> H
    G --> J
    H --> J
    I --> K
    J --> M
    J --> O
    K --> P
    E --> F
    F --> D
    M --> N`;

  const databaseDiagram = `erDiagram
    members ||--o{ competition_participants : participates
    members ||--o{ sessions : instructs
    members ||--o{ sessions : attends
    members ||--o{ passeport_validations : has
    members }o--|| groupe : belongs_to

    profiles ||--|| members : linked_to

    competitions ||--o{ competition_participants : has
    competitions ||--o{ competition_results : has

    sessions ||--o{ exercises : contains
    sessions }o--|| schedules : scheduled_in
    sessions }o--|| cycles : part_of

    exercises }o--|| pedagogy_sheets : based_on

    members ||--o{ parental_authorizations : has
    members ||--o{ bureau : member_of

    sessions ||--o{ student_session_comments : has`;

  // Diagram for database views
  const viewsDiagram = `flowchart TB
    subgraph Tables["📊 Tables de base"]
        members[(members)]
        sessions[(sessions)]
        schedules[(schedules)]
        cycles[(cycles)]
        competitions[(competitions)]
        competition_participants[(competition_participants)]
        passeport_validations[(passeport_validations)]
        student_session_comments[(student_session_comments)]
        pedagogy_sheets[(pedagogy_sheets)]
        exercises[(exercises)]
        member_schedule[(member_schedule)]
    end

    subgraph NormalViews["👁️ Vues normales (VIEW)"]
        secure_members[secure_members]
        volunteer_roles_view[volunteer_roles_view]
        competition_stats[competition_stats]
        member_summary[member_summary]
        session_detail[session_detail]
        competition_summary[competition_summary]
        member_details_counts[member_details_counts]
    end

    subgraph MaterializedViews["⚡ Vues matérialisées (MATERIALIZED VIEW)"]
        attendance_summary[attendance_summary]
        member_statistics[member_statistics]
        pedagogy_sheet_usage[pedagogy_sheet_usage]
    end

    %% Relations pour secure_members
    members --> secure_members

    %% Relations pour volunteer_roles_view
    schedules --> volunteer_roles_view

    %% Relations pour competition_stats
    competition_participants --> competition_stats

    %% Relations pour member_summary
    members --> member_summary
    competition_participants --> member_summary
    competitions --> member_summary

    %% Relations pour session_detail
    sessions --> session_detail
    cycles --> session_detail
    schedules --> session_detail
    student_session_comments --> session_detail

    %% Relations pour competition_summary
    competitions --> competition_summary
    competition_participants --> competition_summary
    members --> competition_summary

    %% Relations pour member_details_counts
    members --> member_details_counts
    sessions --> member_details_counts
    student_session_comments --> member_details_counts
    competition_participants --> member_details_counts
    member_schedule --> member_details_counts
    schedules --> member_details_counts

    %% Relations pour attendance_summary
    sessions --> attendance_summary
    schedules --> attendance_summary
    cycles --> attendance_summary
    student_session_comments --> attendance_summary

    %% Relations pour member_statistics
    members --> member_statistics
    sessions --> member_statistics
    competition_participants --> member_statistics
    passeport_validations --> member_statistics
    student_session_comments --> member_statistics

    %% Relations pour pedagogy_sheet_usage
    pedagogy_sheets --> pedagogy_sheet_usage
    exercises --> pedagogy_sheet_usage

    %% Styling
    classDef table fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef view fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef matview fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class members,sessions,schedules,cycles,competitions,competition_participants,passeport_validations,student_session_comments,pedagogy_sheets,exercises,member_schedule table
    class secure_members,volunteer_roles_view,competition_stats,member_summary,session_detail,competition_summary,member_details_counts view
    class attendance_summary,member_statistics,pedagogy_sheet_usage matview`;

  // Site pages mindmap diagram
  const siteMapDiagram = `mindmap
  root((ALJ Escalade))
    Actualités
      Liste des actualités
        /news
      Détail actualité
        /news/:id
      Créer actualité
        /news/new
      Éditer actualité
        /news/edit/:id
    Compétitions
      Liste compétitions
        /competitions
      Détail compétition
        /competitions/detail/:id
      Créer compétition
        /competitions/new
      Éditer compétition
        /competitions/edit/:id
      Participants
        /competitions/participants/:id
      Résultats
        /competitions/results/:id
      Gestion compétitions
        /competition-management
      Statistiques
        Récap inscriptions
          /inscriptions-summary
        Résumé compétitions
          /competitions-summary
    Membres
      Liste membres
        /volunteers
      Vue membre
        /member-view/:id
      Édition membre
        /member-edit/:id
      Gestion bureau
        /bureau-management
      Autorisations
        /authorization
    Planning
      Planning public
        /schedule
      Agenda
        /agenda
      Admin planning
        /schedule/admin
      Créer créneau
        /schedule/admin/new
      Éditer créneau
        /schedule/admin/edit/:id
    Sessions
      Journal sessions
        /session-log
      Détail session
        /session-log/:id
      Créer session
        /session-log/new
      Éditer session
        /session-log/edit/:id
      Commentaires
        /session-log/:id/comments
      Session live
        /session-log/:id/live
      Récap présences
        /attendance-recap
      Résumé commentaires
        /comments-summary
    Cycles
      Liste cycles
        /cycles
      Détail cycle
        /cycles/:id
    Pédagogie
      Fiches pédagogiques
        /pedagogy
      Créer fiche
        /pedagogy/new
      Éditer fiche
        /pedagogy/edit/:id
      Voir fiche
        /pedagogy/view/:id
      Progression exercices
        /exercise-progress
    Passeport
      Guide passeport
        /passeport-guide
      Validation
        /passeport-validation
      Visualisation
        /passeport-viewer
    Administration
      Dashboard
        /admin-dashboard
      Paramètres site
        /site-settings
      Utilisateurs
        /user-roles
      Permissions
        /permissions
      Groupes
        /groupes/admin
      Images
        /image-admin
      Setup
        /setup
    Monitoring
      Logs connexion
        /connection-logs
      Logs accès
        /access-logs
    Documentation
      Schéma BDD
        /database-schema
      Gestion BDD
        /database-management
      Spécifications
        /specifications
    Statistiques
      Résumé annuel
        /annual-summary
    Pages publiques
      Inscriptions
        /inscriptions
      Connexion
        /login`;

  // Filter pages based on search
  const filteredPages = pagesData.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group pages by category
  const pagesByCategory = filteredPages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});

  return (
    <ProtectedRoute pageTitle="Spécifications Techniques" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-8">
        <Helmet><title>Spécifications Techniques - ALJ Escalade</title></Helmet>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <FileText className="w-10 h-10 text-primary" />
              Spécifications Techniques
            </h1>
            <p className="text-muted-foreground mt-2">
              Documentation complète du système de gestion du club d'escalade
            </p>
          </div>
          <BackButton to="/admin-dashboard" variant="outline" size="sm" />
        </motion.div>

        {/* Main content with tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="database">Base de Données</TabsTrigger>
              <TabsTrigger value="flows">Flux Utilisateur</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vue d'ensemble du Système</CardTitle>
                  <CardDescription>
                    Application web de gestion complète pour le club d'escalade ALJ Jonage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">50</CardTitle>
                        <CardDescription>Pages totales</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">19</CardTitle>
                        <CardDescription>Tables BDD</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">6</CardTitle>
                        <CardDescription>Rôles utilisateur</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold text-orange-600 dark:text-orange-400">6</CardTitle>
                        <CardDescription>Flux principaux</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Technologies Utilisées</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Badge>Frontend</Badge>
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>React 18 avec Hooks</li>
                          <li>React Router pour la navigation</li>
                          <li>Tailwind CSS pour le styling</li>
                          <li>shadcn/ui pour les composants UI</li>
                          <li>Framer Motion pour les animations</li>
                          <li>Lucide React pour les icônes</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Badge>Backend</Badge>
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>Supabase (Backend-as-a-Service)</li>
                          <li>PostgreSQL pour la base de données</li>
                          <li>Row Level Security (RLS)</li>
                          <li>Supabase Storage pour les fichiers</li>
                          <li>Edge Functions pour la logique serveur</li>
                          <li>Authentification JWT</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Rôles et Permissions</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Accès Principal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><Badge variant="secondary">Public</Badge></TableCell>
                          <TableCell>Aucune connexion requise</TableCell>
                          <TableCell>Planning, Compétitions, Actualités, Contact</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge variant="secondary">User</Badge></TableCell>
                          <TableCell>Utilisateur authentifié de base</TableCell>
                          <TableCell>Accès au profil</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge variant="default">Adherent</Badge></TableCell>
                          <TableCell>Membre du club</TableCell>
                          <TableCell>Détails membres, Statistiques, Passeports, Cycles</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge variant="default">Encadrant</Badge></TableCell>
                          <TableCell>Instructeur/Coach</TableCell>
                          <TableCell>Pédagogie, Commentaires de session, Validations passeport</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge variant="default">Bureau</Badge></TableCell>
                          <TableCell>Membre du bureau</TableCell>
                          <TableCell>Édition des informations membres</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge variant="destructive">Admin</Badge></TableCell>
                          <TableCell>Accès complet</TableCell>
                          <TableCell>Toutes les opérations CRUD, Gestion utilisateurs, Paramètres</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pages */}
            <TabsContent value="pages" className="space-y-6">
              {/* Site Map Mindmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Carte du Site</CardTitle>
                  <CardDescription>
                    Organisation hiérarchique de toutes les pages de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={siteMapDiagram} title="Structure des Pages du Site" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toutes les Pages ({pagesData.length})</CardTitle>
                  <CardDescription>
                    Documentation complète de chaque page avec ses opérations base de données
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search bar */}
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une page..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Pages grouped by category */}
                  {Object.entries(pagesByCategory).map(([category, pages]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mt-4">
                        {category === "Administration" && <Settings className="w-5 h-5 text-primary" />}
                        {category === "Public" && <Users className="w-5 h-5 text-primary" />}
                        {category === "Compétitions" && <GitBranch className="w-5 h-5 text-primary" />}
                        {category === "Pédagogie" && <FileText className="w-5 h-5 text-primary" />}
                        {category}
                        <Badge variant="outline">{pages.length}</Badge>
                      </h3>
                      <div className="space-y-2">
                        {pages.map((page) => (
                          <Card key={page.name} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{page.name}</CardTitle>
                                  <CardDescription className="text-xs">{page.route}</CardDescription>
                                </div>
                                <Badge variant={
                                  page.auth === "Public" ? "secondary" :
                                    page.auth === "Admin" ? "destructive" :
                                      "default"
                                }>
                                  {page.auth}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm text-muted-foreground">{page.description}</p>
                              <div className="flex flex-wrap gap-2 items-center text-sm">
                                <span className="font-semibold">Tables:</span>
                                {page.tables.length > 0 ? (
                                  page.tables.map(table => (
                                    <Badge key={table} variant="outline">{table}</Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic">Aucune</span>
                                )}
                              </div>
                              <div className="flex gap-2 items-center text-sm">
                                <span className="font-semibold">Opérations:</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs">{page.operations}</code>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database */}
            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    Schéma de Base de Données
                  </CardTitle>
                  <CardDescription>
                    Architecture complète de la base de données PostgreSQL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Database diagram */}
                  <MermaidDiagram diagram={databaseDiagram} title="Diagramme des Relations entre Tables" />

                  <Separator />

                  {/* Views diagram */}
                  <MermaidDiagram diagram={viewsDiagram} title="Diagramme des Vues et Tables Sources" />

                  {/* Views documentation */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vues de la Base de Données</h3>
                    <p className="text-sm text-muted-foreground">
                      Les vues permettent d'optimiser les requêtes en pré-calculant des jointures complexes ou en agrégeant des données fréquemment utilisées.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">VIEW</Badge>
                            Vues normales
                          </CardTitle>
                          <CardDescription>Calculées à la volée à chaque requête</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div><strong>secure_members</strong> - Vue sécurisée avec masquage RLS du nom</div>
                          <div><strong>volunteer_roles_view</strong> - Rôles bénévoles (ouvreur/encadrant)</div>
                          <div><strong>competition_stats</strong> - Nombre de participants par compétition</div>
                          <div><strong>member_summary</strong> - Membres avec contacts et compétitions pré-joints</div>
                          <div><strong>session_detail</strong> - Sessions avec cycles et schedules pré-joints</div>
                          <div><strong>competition_summary</strong> - Compétitions avec statistiques de participation</div>
                          <div><strong>member_details_counts</strong> - Comptages pour les détails des membres</div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">MATERIALIZED</Badge>
                            Vues matérialisées
                          </CardTitle>
                          <CardDescription>Données pré-calculées, rafraîchissement périodique requis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div><strong>attendance_summary</strong> - Statistiques de présence par session</div>
                          <div><strong>member_statistics</strong> - Statistiques globales par membre (sessions, compétitions, validations)</div>
                          <div><strong>pedagogy_sheet_usage</strong> - Statistiques d'utilisation des fiches pédagogiques</div>
                          <Separator className="my-2" />
                          <div className="text-xs text-muted-foreground italic">
                            Rafraîchissement via: <code className="bg-muted px-1 rounded">refresh_all_materialized_views()</code>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Tables by type */}
                  {['Core', 'Compétitions', 'Autorisations', 'Logs', 'Progression', 'Configuration'].map(type => {
                    const tables = databaseTables.filter(t => t.type === type);
                    if (tables.length === 0) return null;

                    return (
                      <div key={type}>
                        <h3 className="text-lg font-semibold mb-3">{type}</h3>
                        <div className="space-y-3">
                          {tables.map(table => (
                            <Card key={table.name} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{table.name}</CardTitle>
                                <CardDescription className="text-sm">{table.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Colonnes:</span>
                                  <p className="mt-1 font-mono bg-muted p-2 rounded">{table.columns}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <Separator />

                  {/* Storage buckets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Storage Buckets</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Buckets Privés</CardTitle>
                          <CardDescription>Accès restreint avec URLs signées</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li><Badge variant="destructive">members_photos</Badge> - Photos des membres</li>
                            <li><Badge variant="destructive">competition_photos</Badge> - Photos de compétitions</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Buckets Publics</CardTitle>
                          <CardDescription>Accès public direct</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li><Badge variant="secondary">news</Badge> - Images des actualités</li>
                            <li><Badge variant="secondary">pedagogy_files</Badge> - Fichiers pédagogiques</li>
                            <li><Badge variant="secondary">cycles</Badge> - Documents de cycles</li>
                            <li><Badge variant="secondary">site_assets</Badge> - Assets du site</li>
                            <li><Badge variant="secondary">exercise_images</Badge> - Images d'exercices</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flows */}
            <TabsContent value="flows" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flux Utilisateur Principaux</CardTitle>
                  <CardDescription>
                    Parcours utilisateur complets à travers l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userFlows.map((flow, idx) => (
                    <div key={idx}>
                      <h3 className="text-lg font-semibold mb-3">{flow.name}</h3>
                      <div className="space-y-2">
                        {flow.steps.map((step) => (
                          <div key={step.step} className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                              {step.step}
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="text-sm font-medium">{step.action}</p>
                              <p className="text-xs text-muted-foreground">→ {step.page}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {idx < userFlows.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Architecture */}
            <TabsContent value="architecture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Architecture Technique</CardTitle>
                  <CardDescription>
                    Structure en couches de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Architecture diagram */}
                  <MermaidDiagram diagram={architectureDiagram} title="Diagramme d'Architecture" />

                  <Separator />

                  {/* Architecture layers */}
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-base">Couche Présentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li><strong>React Components:</strong> Composants réutilisables (UI, formulaires, etc.)</li>
                          <li><strong>Pages JSX:</strong> 50 pages pour les différentes fonctionnalités</li>
                          <li><strong>UI Components:</strong> shadcn/ui components (Button, Card, Dialog, etc.)</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <CardTitle className="text-base">Couche Authentification</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li><strong>SupabaseAuthContext:</strong> Context pour l'état d'authentification global</li>
                          <li><strong>ProtectedRoute:</strong> HOC pour protéger les routes selon les rôles</li>
                          <li><strong>useAuth Hook:</strong> Hook personnalisé pour accéder à l'état d'auth</li>
                          <li><strong>Permissions:</strong> Système de permissions granulaires par ressource</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="text-base">Couche Logique</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li><strong>Custom Hooks:</strong> usePageAccess, useMemberViewPermissions, useNewsPermissions, etc.</li>
                          <li><strong>Context Providers:</strong> ConfigContext, MemberDetailContext</li>
                          <li><strong>Utility Functions:</strong> Helpers pour le storage, les images, etc.</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <CardTitle className="text-base">Couche Données</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li><strong>Supabase Client:</strong> Client customisé pour les appels API</li>
                          <li><strong>Storage Utils:</strong> Utilitaires pour gérer les fichiers (memberStorageUtils, newsStorageUtils, etc.)</li>
                          <li><strong>API Calls:</strong> Opérations CRUD via Supabase JS SDK</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <CardTitle className="text-base">Backend Supabase</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li><strong>PostgreSQL:</strong> Base de données relationnelle avec 19 tables</li>
                          <li><strong>Row Level Security:</strong> Sécurité au niveau des lignes pour les données sensibles</li>
                          <li><strong>Edge Functions:</strong> Fonctions serverless (create-admin-user, set-user-role, etc.)</li>
                          <li><strong>Storage Buckets:</strong> Stockage de fichiers avec politique d'accès configurée</li>
                          <li><strong>RPC Functions:</strong> get_schema_info pour l'introspection du schéma</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Edge Functions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Edge Functions</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">create-admin-user</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Création de comptes administrateurs</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">admin-create-user</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Création de comptes utilisateurs par les admins</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">set-user-role</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Modification des rôles utilisateur</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">confirm-user</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Confirmation manuelle d'un compte</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">delete-user</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Suppression sécurisée d'un utilisateur</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">get-users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">Récupération de la liste des utilisateurs</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    Sécurité et Protection des Données
                  </CardTitle>
                  <CardDescription>
                    Mécanismes de sécurité implémentés dans l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
                    <CardHeader>
                      <CardTitle className="text-base">Authentification et Autorisation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Authentification JWT:</strong>
                        <p className="text-muted-foreground">Tokens sécurisés via Supabase Auth pour toutes les requêtes API</p>
                      </div>
                      <div>
                        <strong>Système RBAC (Role-Based Access Control):</strong>
                        <p className="text-muted-foreground">6 rôles distincts (Public, User, Adherent, Bureau, Encadrant, Admin) avec permissions granulaires</p>
                      </div>
                      <div>
                        <strong>ProtectedRoute Component:</strong>
                        <p className="text-muted-foreground">Protection des routes côté client avec redirection automatique</p>
                      </div>
                      <div>
                        <strong>Permissions Context:</strong>
                        <p className="text-muted-foreground">Gestion centralisée des permissions par ressource et action (create/edit)</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
                    <CardHeader>
                      <CardTitle className="text-base">Protection des Données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Row Level Security (RLS):</strong>
                        <p className="text-muted-foreground">Politiques de sécurité au niveau des lignes PostgreSQL pour toutes les tables sensibles</p>
                      </div>
                      <div>
                        <strong>Vue secure_members:</strong>
                        <p className="text-muted-foreground">Masquage automatique du nom de famille pour les rôles non-Admin/Bureau</p>
                      </div>
                      <div>
                        <strong>Données Personnelles:</strong>
                        <p className="text-muted-foreground">Photos des membres stockées dans des buckets privés avec accès restreint</p>
                      </div>
                      <div>
                        <strong>Logs d'Accès:</strong>
                        <p className="text-muted-foreground">Traçabilité complète (access_logs, connection_logs) pour audits de sécurité</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950">
                    <CardHeader>
                      <CardTitle className="text-base">Sécurité du Storage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Buckets Privés:</strong>
                        <ul className="list-disc list-inside text-muted-foreground mt-1 ml-2">
                          <li><code>members_photos</code> - URLs signées temporaires (durée limitée)</li>
                          <li><code>competition_photos</code> - Accès restreint aux utilisateurs authentifiés</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Buckets Publics:</strong>
                        <ul className="list-disc list-inside text-muted-foreground mt-1 ml-2">
                          <li><code>news</code> - Images publiques d'actualités</li>
                          <li><code>pedagogy_files</code> - Ressources pédagogiques</li>
                          <li><code>cycles</code>, <code>site_assets</code>, <code>exercise_images</code></li>
                        </ul>
                      </div>
                      <div>
                        <strong>Signed URLs:</strong>
                        <p className="text-muted-foreground">Génération automatique d'URLs temporaires pour les ressources privées via Storage Utils</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950">
                    <CardHeader>
                      <CardTitle className="text-base">Protection des Opérations Critiques</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Edge Functions:</strong>
                        <p className="text-muted-foreground">Opérations sensibles (création admin, gestion des rôles) exécutées côté serveur</p>
                      </div>
                      <div>
                        <strong>Validation des Permissions:</strong>
                        <p className="text-muted-foreground">Double vérification (client + serveur) pour toutes les opérations d'écriture</p>
                      </div>
                      <div>
                        <strong>Confirmations Utilisateur:</strong>
                        <p className="text-muted-foreground">Confirmations obligatoires pour les actions destructives (suppression, archivage)</p>
                      </div>
                      <div>
                        <strong>Soft Deletes:</strong>
                        <p className="text-muted-foreground">Utilisation de flags is_active au lieu de suppressions physiques (ex: cycles)</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
                    <CardHeader>
                      <CardTitle className="text-base">Bonnes Pratiques Implémentées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✓ Pas de clés API exposées côté client</li>
                        <li>✓ Variables d'environnement pour les secrets</li>
                        <li>✓ HTTPS obligatoire en production</li>
                        <li>✓ Validation des entrées utilisateur</li>
                        <li>✓ Protection CSRF via Supabase</li>
                        <li>✓ Rate limiting sur les Edge Functions</li>
                        <li>✓ Audit trail complet des actions utilisateur</li>
                        <li>✓ Separation of concerns (client/server logic)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default Specifications;
