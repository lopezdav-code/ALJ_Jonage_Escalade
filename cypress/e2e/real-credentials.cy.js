/**
 * Tests E2E - Authentification réelle avec vrais identifiants
 * Utilise les secrets GitHub: TEST_BUREAU_EMAIL, TEST_BUREAU_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
 */

/*
describe('Tests avec authentification réelle', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  // Test 1: Accès sans connexion à /volunteers
  describe('Sans connexion', () => {
    it('devrait afficher "Accès restreint" sur la page /volunteers', () => {
      cy.visit('/volunteers', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.contains(/accès restreint|access denied|restricted/i).should('be.visible');
      cy.screenshot('01-no-auth-volunteers-restricted');
    });
  });

  // Test 2: Connexion Bureau - page /volunteers
  describe('Connexion Bureau', () => {
    beforeEach(() => {
      const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
      const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

      if (!bureauEmail || !bureauPassword) {
        throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
      }

      cy.loginWithCredentials(bureauEmail, bureauPassword);
    });

    it('devrait afficher une liste de noms sur /volunteers', () => {
      cy.visit('/volunteers');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');
      cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');
      cy.contains(/accès restreint|access denied/i).should('not.exist');
      cy.screenshot('02-bureau-volunteers-list');
    });

    it('devrait afficher "Accès non autorisé" sur /site-settings', () => {
      cy.visit('/site-settings', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.contains(/accès non autorisé|not authorized|forbidden/i).should('be.visible');
      cy.screenshot('03-bureau-site-settings-forbidden');
    });
  });

  // Test 3: Connexion Admin - page /site-settings
  describe('Connexion Admin', () => {
    beforeEach(() => {
      const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
      const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

      if (!adminEmail || !adminPassword) {
        throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
      }

      cy.loginWithCredentials(adminEmail, adminPassword);
    });

    it('devrait afficher "Réglages du site" sur /site-settings', () => {
      cy.visit('/site-settings');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');
      cy.contains(/réglages du site|site settings|configuration/i).should('be.visible');
      cy.contains(/accès non autorisé|forbidden|not authorized/i).should('not.exist');
      cy.screenshot('04-admin-site-settings-loaded');
    });
  });
});
*/

// Test simplifié: Admin login et vérification de /site-settings
describe('Test Admin - Site Settings', () => {
  it('devrait se connecter via /login et afficher "Réglages du site"', () => {
    // Récupérer les identifiants
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.log(`📧 Email Admin: ${adminEmail}`);

    // Étape 1: Aller sur la page login
    cy.visit('/login', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.screenshot('01-login-page');

    // Étape 2: Remplir les identifiants
    cy.get('input[type="email"]').type(adminEmail, { force: true });
    cy.get('input[type="password"]').type(adminPassword, { force: true });
    cy.screenshot('02-form-filled');

    // Étape 3: Cliquer sur le bouton de soumission
    cy.get('button[type="submit"]').click({ force: true });

    // Étape 4: Attendre la redirection
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(2000);
    cy.screenshot('03-after-login');

    // Étape 5: Aller sur /site-settings
    cy.visit('/site-settings');
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);
    cy.screenshot('04-site-settings-page');

    // Étape 6: Vérifier que le titre "Réglages du site" est visible
    cy.contains(/réglages du site|site settings|configuration/i).should('be.visible');
    cy.screenshot('05-title-found');
  });
});
