/**
 * Tests E2E - Bureau Pages Autorisées
 * Teste l'accès aux pages autorisées pour le rôle Bureau
 */

describe('✅ Bureau - Pages Autorisées', () => {
  // Connexion avec cy.session() et validate pour persister la session entre les tests
  beforeEach(() => {
    const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
    const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

    if (!bureauEmail || !bureauPassword) {
      throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
    }

    // cy.session() crée et réutilise automatiquement la session entre tous les tests
    cy.session(`bureau-allowed-${bureauEmail}`, () => {
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

  it('devrait afficher /volunteers (liste des adhérents)', () => {
    cy.log('📄 Test: Page /volunteers');

    cy.visit('/volunteers', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint|access denied|forbidden/i).should('not.exist');

    cy.log('✅ Page /volunteers accessible');
  });

  it('devrait afficher /bureau-management', () => {
    cy.log('📄 Test: Page /bureau-management');

    cy.visit('/bureau-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu ou un titre
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');

    cy.log('✅ Page /bureau-management accessible');
  });
});
