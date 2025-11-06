/**
 * Cypress Support - Configuration et commandes globales
 */

// Authentification Supabase pour les tests
Cypress.Commands.add('loginAsAdmin', () => {
  // Utilise les variables d'environnement du test
  const supabaseUrl = Cypress.env('SUPABASE_URL') || 'https://ysatjuqxobhosvnyihbh.supabase.co';
  const supabaseAnonKey = Cypress.env('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzYXRqdXF4b2Job3N2bnlpaGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI0NDg0NDgsImV4cCI6MjAwODA0ODQ0OH0.fEQE5OMpWRZCFoqqQ8Z6m4pYrCLqkqjHNqvVZ4e8Jnw';

  // Simuler l'authentification via localStorage
  // Dans un cas réel, tu pourrais utiliser une API de test ou un compte de test dédié
  const mockSession = {
    access_token: 'mock-token-for-testing',
    refresh_token: 'mock-refresh-token',
    user: {
      id: 'admin-test-user-id',
      email: 'admin@test.com',
      user_metadata: {
        firstname: 'Admin',
        lastname: 'Test'
      }
    }
  };

  // Stocker la session dans localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('sb-ysatjuqxobhosvnyihbh-auth-token', JSON.stringify(mockSession));
  });

  // Recharger la page pour que l'authentification soit appliquée
  cy.visit('/');
  cy.get('body', { timeout: 5000 }).should('be.visible');
});

// Attendre que la page se charge complètement
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('[class*="loader"], [class*="loading"]', { timeout: 2000 }).should('not.be.visible');
});

// Vérifier qu'une page s'affiche correctement
Cypress.Commands.add('checkPageLoad', (pageName) => {
  cy.get('body').should('be.visible');
  cy.get('h1, h2, [class*="title"], [class*="header"]').should('have.length.greaterThan', 0);
  cy.get('[class*="error"]').should('not.be.visible');
});

// Prendre une capture d'écran avec nom automatique
Cypress.Commands.add('saveScreenshot', (prefix = '') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = prefix ? `${prefix}-${timestamp}` : timestamp;
  cy.screenshot(name);
});

// Configuration globale
beforeEach(() => {
  // Désactiver les erreurs non bloquantes
  cy.on('uncaught:exception', (err) => {
    // Ignorer certaines erreurs
    if (err.message.includes('ResizeObserver')) {
      return false;
    }
    return true;
  });
});

// Afficher les informations de test
afterEach(function () {
  if (this.currentTest.state === 'passed') {
    cy.log(`✅ Test réussi: ${this.currentTest.title}`);
  } else if (this.currentTest.state === 'failed') {
    cy.log(`❌ Test échoué: ${this.currentTest.title}`);
  }
});
