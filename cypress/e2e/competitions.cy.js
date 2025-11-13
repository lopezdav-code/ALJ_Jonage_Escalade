/**
 * Tests E2E - Compétitions
 * Teste les pages et interactions liées aux compétitions
 */

describe('🏆 Compétitions - Pages et Interactions', () => {
  // Connexion avec cy.session() pour persister la session
  beforeEach(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.session('competitions-admin', () => {
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

  it('devrait afficher /competitions (Liste des compétitions)', () => {
    cy.log('📄 Test: Page /competitions');

    cy.visit('/competitions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/competitions');

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ Page /competitions accessible');
  });

  it('devrait avoir une structure de page valide pour compétitions', () => {
    cy.visit('/competitions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier les éléments clés de la page
    cy.get('h1, h2').should('have.length.greaterThan', 0);

    // Vérifier qu'il y a des interactions possibles
    cy.get('[role="main"], main').should('be.visible');

    cy.log('✅ Structure de page valide');
  });

  it('ne devrait pas afficher d\'erreur sur /competitions-summary', () => {
    cy.visit('/competitions-summary', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('not.include', '/login');
    cy.url().should('not.include', '/auth');

    // Vérifier pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ /competitions-summary accessible');
  });

  it('devrait charger /federal-calendar sans erreur', () => {
    cy.visit('/federal-calendar', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('not.include', '/login');
    cy.url().should('not.include', '/auth');

    // Vérifier pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ /federal-calendar accessible');
  });

  it('devrait avoir du contenu principal sur /competitions', () => {
    cy.visit('/competitions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'il y a au minimum un titre et du contenu
    cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

    // Au minimum un élément de navigation ou de contenu
    cy.get('[role="main"], main, section, [data-test], button, a').should('have.length.greaterThan', 0);

    cy.log('✅ Page a du contenu principal');
  });

  it('devrait vérifier que les pages importantes ne sont pas bloquées', () => {
    const importantPages = [
      '/competitions',
      '/competitions-summary',
      '/federal-calendar'
    ];

    importantPages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier pas de redirection login
      cy.url().should('not.include', '/login');

      // Vérifier pas d'accès restreint
      cy.contains('h1', /Accès restreint/i).should('not.exist');
    });

    cy.log('✅ Toutes les pages importantes sont accessibles');
  });
});
