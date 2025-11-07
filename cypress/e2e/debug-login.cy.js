/**
 * Test simplifié - Debug connexion Bureau
 */

describe('🔍 Test connexion Bureau', () => {
  it('devrait afficher la page d\'accueil', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.screenshot('01-homepage');
  });

  it('devrait lister tous les inputs et boutons de la page', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Afficher les inputs
    cy.get('input').then(($inputs) => {
      cy.log(`📝 Inputs trouvés: ${$inputs.length}`);
      $inputs.each((index, input) => {
        cy.log(`  [${index}] type="${input.type}" name="${input.name}" placeholder="${input.placeholder}"`);
      });
    });

    // Afficher les boutons
    cy.get('button').then(($buttons) => {
      cy.log(`🔘 Boutons trouvés: ${$buttons.length}`);
      $buttons.each((index, button) => {
        cy.log(`  [${index}] "${button.textContent.trim()}" (type="${button.type}")`);
      });
    });
  });

  it('devrait essayer de se connecter avec le compte Bureau', () => {
    const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL');
    const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD');

    cy.log(`📧 Email: ${bureauEmail ? '✅ Configuré' : '❌ Manquant'}`);
    cy.log(`🔐 Password: ${bureauPassword ? '✅ Configuré' : '❌ Manquant'}`);

    if (!bureauEmail || !bureauPassword) {
      cy.log('⚠️ Variables d\'environnement manquantes!');
      return;
    }

    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Remplir les champs avec les premiers inputs
    cy.get('input').first().type(bureauEmail);
    cy.get('input').eq(1).type(bureauPassword);

    cy.screenshot('02-form-filled');

    // Soumettre le formulaire
    cy.get('button').then(($buttons) => {
      if ($buttons.length > 0) {
        cy.get('button').first().click();
      }
    });

    // Attendre et capturer la page après login
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.screenshot('03-after-login');

    // Afficher l'URL actuelle
    cy.url().then((url) => {
      cy.log(`📍 URL après login: ${url}`);
    });
  });
});
