/**
 * Cypress Support - Configuration et commandes globales
 */

// Authentification Supabase pour les tests
Cypress.Commands.add('loginAsAdmin', () => {
  // Utilise UNIQUEMENT les variables d'environnement (depuis les secrets GitHub)
  const supabaseUrl = Cypress.env('VITE_SUPABASE_URL');
  const supabaseAnonKey = Cypress.env('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Variables d\'environnement manquantes: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY');
  }

  // Extraire l'ID du projet depuis l'URL Supabase
  // URL format: https://[project-id].supabase.co
  const projectId = supabaseUrl.split('//')[1].split('.')[0];

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

  // Stocker la session dans localStorage avec la bonne clé
  cy.window().then((win) => {
    // La clé localStorage dépend de l'ID du projet Supabase
    const authKey = `sb-${projectId}-auth-token`;
    win.localStorage.setItem(authKey, JSON.stringify(mockSession));
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
