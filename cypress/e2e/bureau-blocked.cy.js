/**
 * Tests E2E - Bureau Pages Bloquées
 * Teste le blocage des pages interdites pour le rôle Bureau
 */

describe('🔒 Bureau - Pages Bloquées', () => {
  // Connexion avec cy.session() et validate pour persister la session entre les tests
  beforeEach(() => {
    const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
    const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

    if (!bureauEmail || !bureauPassword) {
      throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
    }

    // cy.session() crée et réutilise automatiquement la session entre tous les tests
    cy.session(`bureau-blocked-${bureauEmail}`, () => {
      cy.log(`📧 Connexion Bureau: ${bureauEmail}`);
      cy.visit('/', { failOnStatusCode: false });
      cy.loginWithCredentials(bureauEmail, bureauPassword);
      cy.wait(2000);

      // Vérifier que la session est établie
      cy.get('body', { timeout: 10000 }).should('be.visible');
    }, {
      // Valider que la session est toujours active
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

    // Après la session, aller sur la page d'accueil
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
  });

  it('devrait bloquer l\'accès à /site-settings (Admin only)', () => {
    cy.log('📄 Test: Blocage /site-settings pour Bureau');

    cy.visit('/site-settings', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(500);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/site-settings');

    // Vérifier que l'accès est bien restreint (affichage du composant ProtectedRoute)
    cy.contains('h1', /Accès restreint/i).should('be.visible');

    cy.log('✅ Accès correctement bloqué à /site-settings');
  });

  it('devrait bloquer l\'accès à /admin-management', () => {
    cy.log('📄 Test: Blocage /admin-management pour Bureau');

    cy.visit('/admin-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(500);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/admin-management');

    // Vérifier que l'accès est bien restreint (affichage du composant ProtectedRoute)
    cy.contains('h1', /Accès restreint/i).should('be.visible');

    cy.log('✅ Accès correctement bloqué à /admin-management');
  });
});
