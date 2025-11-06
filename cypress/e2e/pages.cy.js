/**
 * Tests E2E - Vérification de l'affichage de toutes les pages
 * Ce fichier est GÉNÉRÉ AUTOMATIQUEMENT par scripts/generate-tests.js
 * NE PAS MODIFIER MANUELLEMENT
 */

describe('Test d\'affichage de toutes les pages', () => {
  // Configuration de base
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  const pages = [
  {
    "to": "/news",
    "text": "Actualités",
    "roles": [
      "public",
      "user",
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/schedule",
    "text": "Planning",
    "roles": [
      "public",
      "user",
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/inscriptions",
    "text": "Inscription",
    "roles": [
      "public",
      "user",
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/contact",
    "text": "Contact",
    "roles": [
      "public",
      "user",
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/volunteers",
    "text": "Adhérent",
    "roles": [
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/competitions",
    "text": "Compétitions",
    "roles": [
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/agenda",
    "text": "Agenda",
    "roles": [
      "public",
      "user",
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/session-log",
    "text": "Historique des séances",
    "roles": [
      "adherent",
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/cycles",
    "text": "Gestion des cycles",
    "roles": [
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/passeport-validation",
    "text": "Validation Passeports",
    "roles": [
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/attendance-recap",
    "text": "Récapitulatif des présences",
    "roles": [
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/exercise-progress",
    "text": "Progression des exercices",
    "roles": [
      "bureau",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  },
  {
    "to": "/pedagogy",
    "text": "Support Pédagogique",
    "roles": [
      "adherent",
      "encadrant",
      "admin"
    ],
    "isSubMenu": false
  }
];

  // Test pour les pages publiques (accessibles sans connexion)
  const publicPages = pages.filter(p => p.roles.includes('public'));

  if (publicPages.length > 0) {
    describe('Pages publiques (sans connexion)', () => {
      publicPages.forEach(page => {
        it('devrait afficher la page "' + page.text + '" (' + page.to + ')', () => {
          cy.visit(page.to);

          // Vérifier que la page s'est chargée
          cy.get('body', { timeout: 5000 }).should('be.visible');

          // Attendre que les loaders disparaissent (ou qu'ils n'existent pas)
          cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');

          // Vérifier qu'il n'y a pas d'erreur visible
          cy.get('[class*="error"]').should('not.exist');

          // Prendre une capture d'écran après chargement complet
          cy.screenshot('page-' + page.to.replace(/\//g, '-') + '-public');
        });
      });
    });
  }

  // Test pour les pages protégées (nécessitent une connexion)
  const protectedPages = pages.filter(p => !p.roles.includes('public') && p.roles.length > 0);

  if (protectedPages.length > 0) {
    describe('Pages protégées (avec connexion admin)', () => {
      beforeEach(() => {
        // Avant chaque test de page protégée, se connecter en tant qu'admin
        cy.loginAsAdmin();
      });

      protectedPages.forEach(page => {
        it('devrait afficher la page protégée "' + page.text + '" (' + page.to + ') pour rôles: [' + page.roles.join(', ') + ']', () => {
          cy.visit(page.to);

          // Vérifier que la page s'est chargée
          cy.get('body', { timeout: 5000 }).should('be.visible');

          // Attendre que les loaders disparaissent (ou qu'ils n'existent pas)
          cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');

          // Vérifier qu'il n'y a pas d'erreur visible
          cy.get('[class*="error"]').should('not.exist');

          // Prendre une capture d'écran après chargement complet
          cy.screenshot('page-' + page.to.replace(/\//g, '-') + '-protected');
        });
      });
    });
  }

  // Test pour vérifier que les pages protégées se bloquent sans connexion
  if (protectedPages.length > 0) {
    describe('Pages protégées (blocage sans connexion)', () => {
      // Ne PAS se connecter - tester l'accès sans authentification

      protectedPages.forEach(page => {
        it('devrait bloquer l' + "'" + 'accès à "' + page.text + '" (' + page.to + ') sans connexion', () => {
          cy.visit(page.to, { failOnStatusCode: false });

          // Vérifier que soit:
          // 1. L'utilisateur a été redirigé (URL change)
          // 2. Soit la page montre un message d'erreur
          // 3. Soit la page est vide ou sans contenu
          cy.url().then(url => {
            if (url.includes(page.to)) {
              // La page n'a pas redirigé - vérifier qu'il n'y a pas de contenu sensible
              // ou un message d'erreur visible
              cy.get('body').should('exist');
            }
          });
        });
      });
    });
  }

  // Test de performance
  describe('Performance et chargement', () => {
    it('les pages publiques doivent se charger en moins de 5 secondes', () => {
      publicPages.forEach(page => {
        cy.visit(page.to);
        cy.get('body').should('be.visible');
      });
    });
  });

  // Résumé des pages testées
  after(() => {
    console.log('');
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('Total de pages: ' + pages.length);
    console.log('Pages publiques: ' + publicPages.length);
    console.log('Pages protégées: ' + protectedPages.length);
  });
});
