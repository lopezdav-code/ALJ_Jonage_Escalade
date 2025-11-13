/**
 * Tests E2E - Mode ADMIN - Pages Accessibles à l'Admin
 * Teste les pages accessibles avec le rôle Admin
 */

describe('3️⃣  Mode Admin - Pages Accessibles', () => {
  // Connexion avec cy.session() pour persister la session entre les tests
  before(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    // Utiliser cy.session() pour sauvegarder et réutiliser la session
    cy.session('admin-login', () => {
      cy.log(`📧 Connexion Admin: ${adminEmail}`);
      cy.visit('/', { failOnStatusCode: false });
      cy.loginWithCredentials(adminEmail, adminPassword);
      cy.wait(2000);
    });
  });

  it('devrait afficher la page d\'accueil après connexion', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Vérifier qu'on n'a pas de message d'accès restreint (titre du composant ProtectedRoute)
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    /*cy.screenshot('admin-homepage');*/
  });


  it('devrait afficher /site-settings (Réglages du site)', () => {
    cy.visit('/site-settings');
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier qu'on n'a pas été redirigé
    cy.url().should('include', '/site-settings');

    // Vérifier le titre
    cy.contains(/réglages du site|site settings|configuration/i).should('be.visible');

    // Vérifier qu'il n'y a pas de message d'erreur d'accès restreint (titre du composant ProtectedRoute)
    cy.contains('h1', /Accès restreint/i).should('not.exist');

    /*cy.screenshot('admin-site-settings');*/
  });
  /*
  // À décommenter après validation de la connexion
  it('devrait afficher /admin-management', () => {
    cy.visit('/admin-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-admin-management');
  });

  it('devrait afficher /user-roles (Gestion des rôles)', () => {
    cy.visit('/user-roles', { failOnStatusCode: false });

    // waitForPageLoad gère automatiquement le reload si la page est bloquée
    cy.waitForPageLoad();

    // Vérifier qu'il y a du contenu après le chargement
    cy.get('h1, h2, main', { timeout: 10000 }).should('exist');

    cy.screenshot('admin-user-roles');
  });

  it('devrait afficher /permissions (Gestion des permissions)', () => {
    cy.visit('/permissions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-permissions');
  });

  it('devrait afficher /access-logs (Logs d\'accès)', () => {
    cy.visit('/access-logs', { failOnStatusCode: false });

    // waitForPageLoad gère automatiquement le reload si la page est bloquée
    cy.waitForPageLoad();

    // Vérifier qu'il y a du contenu après le chargement
    cy.get('h1, h2, main', { timeout: 10000 }).should('exist');

    cy.screenshot('admin-access-logs');
  });

  it('devrait afficher /volunteers (Adhérents)', () => {
    cy.visit('/volunteers');
    cy.get('body', { timeout: 6000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-volunteers');
  });
  */
});
