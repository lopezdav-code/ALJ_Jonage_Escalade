/**
 * Cypress Support - Configuration et commandes globales
 */

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
