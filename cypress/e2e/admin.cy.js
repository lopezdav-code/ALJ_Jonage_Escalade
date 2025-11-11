/**
 * Tests E2E - Mode ADMIN - Pages Accessibles à l'Admin
 * Teste les pages accessibles avec le rôle Admin
 */

describe('3️⃣  Mode Admin - Pages Accessibles', () => {
  // Utiliser cy.session() pour persister la session entre les tests
  beforeEach(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.session(`admin-session-${adminEmail}`, () => {
      cy.log(`📧 Connexion Admin: ${adminEmail}`);
      cy.visit('/', { failOnStatusCode: false });
      cy.wait(500);
      cy.loginWithCredentials(adminEmail, adminPassword);
      cy.wait(2000);
      cy.log('✅ Connexion terminée');

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

  it('devrait afficher la page d\'accueil après connexion', () => {
    cy.log('📄 Test: Page d\'accueil');

    // Vérifier qu'on est bien connecté (pas de message d'accès restreint)
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page d\'accueil accessible');
  });

  it('devrait afficher /site-settings (Réglages du site)', () => {
    cy.log('📄 Test: Page site-settings');

    cy.visit('/site-settings', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'il n'y a pas de message d'erreur d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page site-settings accessible');
  });

  it('devrait afficher /admin-management (Gestion Admin)', () => {
    cy.log('📄 Test: Page admin-management');

    cy.visit('/admin-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page admin-management accessible');
  });

  it('devrait afficher /user-roles (Gestion des rôles)', () => {
    cy.log('📄 Test: Page user-roles');

    cy.visit('/user-roles', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page user-roles accessible');
  });

  it('devrait afficher /permissions (Gestion des permissions)', () => {
    cy.log('📄 Test: Page permissions');

    cy.visit('/permissions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page permissions accessible');
  });

  it('devrait afficher /access-logs (Logs d\'accès)', () => {
    cy.log('📄 Test: Page access-logs');

    cy.visit('/access-logs', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page access-logs accessible');
  });

  it('devrait afficher /volunteers (Adhérents)', () => {
    cy.log('📄 Test: Page volunteers');

    cy.visit('/volunteers', { failOnStatusCode: false });
    cy.get('body', { timeout: 6000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.log('✅ Page volunteers accessible');
  });
});
