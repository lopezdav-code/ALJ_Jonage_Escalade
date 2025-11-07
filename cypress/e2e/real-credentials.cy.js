/**
 * Tests E2E - Authentification réelle avec vrais identifiants
 * Utilise les secrets GitHub: TEST_BUREAU_EMAIL, TEST_BUREAU_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
 */

describe('Tests avec authentification réelle', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  /**
   * Test 1: Accès sans connexion à /volunteers
   * Attendu: Page affiche "Accès restreint"
   */
  describe('Sans connexion', () => {
    it('devrait afficher "Accès restreint" sur la page /volunteers', () => {
      cy.visit('/volunteers', { failOnStatusCode: false });

      // Attendre le chargement
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier que le message "Accès restreint" est visible
      cy.contains(/accès restreint|access denied|restricted/i).should('be.visible');

      cy.screenshot('01-no-auth-volunteers-restricted');
    });
  });

  /**
   * Test 2: Connexion Bureau - page /volunteers
   * Attendu: Page affiche une liste de noms
   */
  describe('Connexion Bureau', () => {
    beforeEach(() => {
      // Récupérer les identifiants depuis les variables d'environnement
      const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
      const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

      if (!bureauEmail || !bureauPassword) {
        throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
      }

      // Se connecter avec les vrais identifiants
      cy.loginWithCredentials(bureauEmail, bureauPassword);
    });

    it('devrait afficher une liste de noms sur /volunteers', () => {
      cy.visit('/volunteers');

      // Attendre le chargement
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');

      // Vérifier qu'il y a du contenu (liste de noms)
      cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

      // Vérifier qu'il n'y a pas de message "Accès restreint"
      cy.contains(/accès restreint|access denied/i).should('not.exist');

      cy.screenshot('02-bureau-volunteers-list');
    });

    it('devrait afficher "Accès non autorisé" sur /site-settings', () => {
      cy.visit('/site-settings', { failOnStatusCode: false });

      // Attendre le chargement
      cy.get('body', { timeout: 5000 }).should('be.visible');

      // Vérifier le message "Accès non autorisé"
      cy.contains(/accès non autorisé|not authorized|forbidden/i).should('be.visible');

      cy.screenshot('03-bureau-site-settings-forbidden');
    });
  });

  /**
   * Test 3: Connexion Admin - page /site-settings
   * Attendu: Page affiche le titre "Réglages du site" ou "Settings"
   */
  describe('Connexion Admin', () => {
    beforeEach(() => {
      // Récupérer les identifiants depuis les variables d'environnement
      const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
      const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

      if (!adminEmail || !adminPassword) {
        throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
      }

      // Log avant connexion
      cy.log(`📧 Connexion Admin: ${adminEmail}`);

      // Se connecter avec les vrais identifiants
      cy.loginWithCredentials(adminEmail, adminPassword);

      // Log après connexion
      cy.url().then((url) => {
        cy.log(`📍 URL après connexion: ${url}`);
      });
    });

    it('devrait afficher "Réglages du site" sur /site-settings', () => {
      cy.log('🔄 Visite de /site-settings');
      cy.visit('/site-settings');

      // Attendre le chargement
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');

      // Log l'URL et vérifier qu'on n'est pas redirigé
      cy.url().then((url) => {
        cy.log(`📍 URL sur site-settings: ${url}`);
      });

      // Log le contenu de la page
      cy.get('h1, h2, main, [role="main"]').then(($elements) => {
        cy.log(`🔍 Éléments trouvés: ${$elements.length}`);
        $elements.each((i, el) => {
          cy.log(`  [${i}] ${el.tagName}: ${el.textContent.substring(0, 100)}`);
        });
      });

      // Vérifier le titre "Réglages du site" ou variantes
      cy.contains(/réglages du site|site settings|configuration/i).should('be.visible');

      // Vérifier qu'il n'y a pas de message d'erreur
      cy.contains(/accès non autorisé|forbidden|not authorized/i).should('not.exist');

      cy.screenshot('04-admin-site-settings-loaded');
    });
  });
});
