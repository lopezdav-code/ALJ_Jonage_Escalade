/**
 * Tests E2E - Admin Dashboard et Management
 * Teste les pages de gestion admin avancées
 */

describe('⚙️ Admin Dashboard et Management', () => {
  // Connexion avec cy.session() pour persister la session
  beforeEach(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.session('admin-dashboard', () => {
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

  it('devrait afficher /admin-dashboard (Tableau de bord Admin)', () => {
    cy.log('📄 Test: Page /admin-dashboard');

    cy.visit('/admin-dashboard', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/admin-dashboard');

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ Page /admin-dashboard accessible');
  });

  it('devrait avoir une structure valide pour le dashboard', () => {
    cy.visit('/admin-dashboard', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier les éléments clés
    cy.get('h1, h2').should('have.length.greaterThan', 0);

    // Vérifier qu'il y a au minimum un élément de dashboard
    cy.get('[role="main"], main, section').should('have.length.greaterThan', 0);

    cy.log('✅ Structure de dashboard valide');
  });

  it('devrait afficher /database-management (Gestion de base de données)', () => {
    cy.log('📄 Test: Page /database-management');

    cy.visit('/database-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/database-management');

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ Page /database-management accessible');
  });

  it('devrait avoir du contenu sur database-management', () => {
    cy.visit('/database-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier les éléments clés
    cy.get('h1, h2').should('have.length.greaterThan', 0);

    // Au minimum un titre et du contenu
    cy.get('[role="main"], main, section, button, a').should('have.length.greaterThan', 0);

    cy.log('✅ Page database-management a du contenu');
  });

  it('devrait charger les pages sans erreur 500', () => {
    const adminPages = [
      '/admin-dashboard',
      '/database-management'
    ];

    adminPages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier pas de redirection
      cy.url().should('not.include', '/login');
      cy.url().should('not.include', '/error');

      // Vérifier pas d'erreur d'accès
      cy.contains('h1', /Accès restreint/i).should('not.exist');
    });

    cy.log('✅ Toutes les pages admin chargent correctement');
  });

  it('devrait avoir navigation visible sur les pages admin', () => {
    const adminPages = [
      '/admin-dashboard',
      '/database-management'
    ];

    adminPages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Vérifier qu'il y a une navigation ou du contenu cliquable
      cy.get('button, a, [role="button"], [role="link"]').should('have.length.greaterThan', 0);
    });

    cy.log('✅ Navigation visible sur pages admin');
  });

  it('devrait afficher du contenu structuré sur admin-dashboard', () => {
    cy.visit('/admin-dashboard', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier structure HTML valide
    cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

    // Vérifier qu'il y a au moins un section ou container
    cy.get('section, article, [class*="container"], [class*="card"]').should('exist');

    cy.log('✅ Contenu structuré correctement');
  });

  it('devrait supporter la navigation vers d\'autres pages admin', () => {
    cy.visit('/admin-dashboard', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il existe des liens
    cy.get('a, button').should('have.length.greaterThan', 0);

    // Vérifier qu'au moins un lien/bouton est visible
    cy.get('a, button').first().should('be.visible');

    cy.log('✅ Navigation disponible');
  });
});
