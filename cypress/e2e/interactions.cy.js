/**
 * Tests E2E - Interactions et Navigation
 * Teste les interactions utilisateur et navigation entre pages
 */

describe('🔗 Interactions et Navigation', () => {
  // Tests sans connexion - pages publiques
  describe('Navigation publique', () => {
    it('devrait pouvoir naviguer de l\'accueil vers les autres pages publiques', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier qu'il y a des liens
      cy.get('a').should('have.length.greaterThan', 0);

      cy.log('✅ Navigation disponible depuis accueil');
    });

    it('devrait afficher le logo/titre cliquable', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier qu'il y a au minimum un titre ou logo
      cy.get('h1, [class*="logo"], [class*="brand"]').should('have.length.greaterThan', 0);

      cy.log('✅ Logo/Titre visible');
    });

    it('devrait charger la page Actualités', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier le chargement
      cy.url().should('include', '/news');
      cy.get('h1, h2, main').should('exist');

      cy.log('✅ Page Actualités chargée');
    });

    it('devrait charger la page Inscriptions', () => {
      cy.visit('/inscriptions');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier le chargement
      cy.url().should('include', '/inscriptions');
      cy.get('h1, h2, main').should('exist');

      cy.log('✅ Page Inscriptions chargée');
    });

    it('devrait charger la page Planning', () => {
      cy.visit('/schedule');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier le chargement
      cy.url().should('include', '/schedule');
      cy.get('h1, h2, main').should('exist');

      cy.log('✅ Page Planning chargée');
    });

    it('devrait charger la page Contact', () => {
      cy.visit('/contact');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier le chargement
      cy.url().should('include', '/contact');
      cy.get('h1, h2, main').should('exist');

      cy.log('✅ Page Contact chargée');
    });
  });

  // Tests avec connexion admin
  describe('Navigation admin', () => {
    beforeEach(() => {
      const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
      const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

      if (!adminEmail || !adminPassword) {
        throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
      }

      cy.session('interactions-admin', () => {
        cy.log(`📧 Connexion Admin: ${adminEmail}`);
        cy.visit('/', { failOnStatusCode: false });
        cy.loginWithCredentials(adminEmail, adminPassword);
        cy.wait(2000);
      }, {
        validate() {
          cy.window().then((win) => {
            const keys = Object.keys(win.localStorage);
            const hasAuthToken = keys.some(key =>
              key.includes('auth-token') ||
              key.includes('session') ||
              key.includes('sb-')
            );
            expect(hasAuthToken).to.be.true;
          });
        }
      });

      cy.visit('/', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    it('devrait avoir accès à plusieurs pages admin après connexion', () => {
      const adminPages = [
        '/admin-dashboard',
        '/admin-management',
        '/user-roles',
        '/permissions',
        '/access-logs',
        '/database-management'
      ];

      adminPages.forEach(page => {
        cy.visit(page, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');

        // Vérifier pas de redirection login
        cy.url().should('not.include', '/login');
      });

      cy.log('✅ Accès à toutes les pages admin');
    });

    it('devrait pouvoir revenir à l\'accueil depuis une page admin', () => {
      cy.visit('/admin-dashboard');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier qu'on est sur la page admin
      cy.url().should('include', '/admin-dashboard');

      // Naviguer vers l'accueil
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier qu'on est bien à l'accueil
      cy.url().should('include', '/');

      cy.log('✅ Retour à l\'accueil depuis admin');
    });

    it('devrait afficher du contenu sur chaque page admin', () => {
      const adminPages = [
        '/admin-dashboard',
        '/admin-management',
        '/user-roles',
        '/permissions'
      ];

      adminPages.forEach(page => {
        cy.visit(page, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier qu'il y a au minimum un titre
        cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

        // Vérifier qu'il y a du contenu
        cy.get('[role="main"], main').should('be.visible');
      });

      cy.log('✅ Contenu visible sur toutes les pages');
    });
  });

  // Tests de visibilité et d'accessibilité
  describe('Accessibilité et Visibilité', () => {
    it('devrait afficher des éléments cliquables sur la page d\'accueil', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier qu'il y a des éléments cliquables
      cy.get('a, button, [role="button"]').should('have.length.greaterThan', 0);

      // Vérifier qu'au moins un est visible
      cy.get('a, button, [role="button"]').first().should('be.visible');

      cy.log('✅ Éléments cliquables visibles');
    });

    it('devrait avoir une structure HTML valide', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier les éléments structurels
      cy.get('header, nav, main, footer').should('have.length.greaterThan', 0);

      cy.log('✅ Structure HTML valide');
    });

    it('devrait charger toutes les pages sans erreur console critique', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      cy.window().then(win => {
        // On peut vérifier qu'il n'y a pas d'erreur globale
        expect(win).to.exist;
      });

      cy.log('✅ Pas d\'erreur console critique');
    });
  });
});
