/**
 * Tests E2E - Sessions et Cours
 * Teste les pages et interactions liées aux sessions/cours
 */

describe('📋 Sessions et Cours - Pages et Interactions', () => {
  // Connexion avec cy.session() pour persister la session
  beforeEach(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.session('sessions-admin', () => {
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

  it('devrait afficher /session-log (Historique des sessions)', () => {
    cy.log('📄 Test: Page /session-log');

    cy.visit('/session-log', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/session-log');

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ Page /session-log accessible');
  });

  it('devrait avoir une structure de page valide pour session-log', () => {
    cy.visit('/session-log', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier les éléments clés de la page
    cy.get('h1, h2').should('have.length.greaterThan', 0);

    // Vérifier qu'il y a un contenu principal
    cy.get('[role="main"], main').should('be.visible');

    cy.log('✅ Structure de page valide');
  });

  it('devrait charger /schedule (Planning des cours) sans erreur', () => {
    cy.visit('/schedule', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/schedule');

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier pas de message d'accès restreint
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    cy.log('✅ /schedule accessible');
  });

  it('devrait avoir du contenu sur /schedule', () => {
    cy.visit('/schedule', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'il y a au minimum un titre et du contenu
    cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

    // Au minimum un élément de navigation ou de contenu
    cy.get('[role="main"], main, section, [data-test], button, a').should('have.length.greaterThan', 0);

    cy.log('✅ Page /schedule a du contenu');
  });

  it('devrait vérifier que les pages sessions ne sont pas bloquées', () => {
    const sessionPages = [
      '/session-log',
      '/schedule'
    ];

    sessionPages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier pas de redirection login
      cy.url().should('not.include', '/login');

      // Vérifier pas d'accès restreint
      cy.contains('h1', /Accès restreint/i).should('not.exist');
    });

    cy.log('✅ Toutes les pages sessions sont accessibles');
  });

  it('devrait afficher un contenu structuré sur les pages sessions', () => {
    const sessionPages = [
      '/session-log',
      '/schedule'
    ];

    sessionPages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier structure basique
      cy.get('h1, h2, main, [role="main"]').should('exist');

      // Vérifier qu'il y a au moins un titre
      cy.get('h1, h2, h3').should('have.length.greaterThan', 0);
    });

    cy.log('✅ Toutes les pages ont du contenu structuré');
  });
});
