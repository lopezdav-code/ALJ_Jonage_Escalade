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

    // Chercher les inputs par type
    cy.get('input[type="email"]').then(($emailInputs) => {
      if ($emailInputs.length > 0) {
        cy.get('input[type="email"]').first().type(bureauEmail, { force: true });
        cy.log('✅ Email saisi dans input[type="email"]');
      } else {
        cy.log('❌ Pas d\'input[type="email"] trouvé');
      }
    });

    cy.get('input[type="password"]').then(($pwdInputs) => {
      if ($pwdInputs.length > 0) {
        cy.get('input[type="password"]').first().type(bureauPassword, { force: true });
        cy.log('✅ Password saisi dans input[type="password"]');
      } else {
        cy.log('❌ Pas d\'input[type="password"] trouvé');
      }
    });

    cy.screenshot('02-form-filled');

    // Soumettre le formulaire
    cy.get('button[type="submit"]').then(($submitBtn) => {
      if ($submitBtn.length > 0) {
        cy.get('button[type="submit"]').first().click({ force: true });
        cy.log('✅ Bouton submit cliqué');
      } else {
        cy.get('button').first().click({ force: true });
        cy.log('⚠️ Pas de button[type="submit"], premier bouton cliqué');
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
