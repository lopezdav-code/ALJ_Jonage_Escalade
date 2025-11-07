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

    // Essayer de cliquer sur un bouton login si visible
    cy.get('button, a').then(($elements) => {
      const loginBtn = [...$elements].find($el =>
        /login|connexion|se connecter|sign in/i.test($el.textContent)
      );
      if (loginBtn) {
        cy.log('🔘 Bouton login trouvé, clic...');
        cy.wrap(loginBtn).click({ force: true });
        cy.get('body').then(() => {
          cy.wait(1000); // Attendre l'apparition du formulaire
        });
      } else {
        cy.log('ℹ️ Pas de bouton login trouvé, on continue');
      }
    });

    // Essayer avec input[type="email"]
    cy.get('input[type="email"]', { timeout: 2000 }).then(($emailInputs) => {
      if ($emailInputs.length > 0) {
        cy.get('input[type="email"]').first().type(bureauEmail, { force: true });
        cy.log('✅ Email saisi dans input[type="email"]');
      } else {
        cy.log('❌ input[type="email"] pas trouvé, essaie input[type="text"]...');

        // Fallback: essayer avec type="text" et placeholder/name contenant "email"
        cy.get('input[type="text"], input:not([type])', { timeout: 2000 }).then(($inputs) => {
          if ($inputs.length > 0) {
            cy.get('input[type="text"], input:not([type])').first().type(bureauEmail, { force: true });
            cy.log('✅ Email saisi dans input[type="text"]');
          } else {
            cy.log('❌ Aucun input de type text trouvé');
          }
        });
      }
    });

    // Essayer avec input[type="password"]
    cy.get('input[type="password"]', { timeout: 2000 }).then(($pwdInputs) => {
      if ($pwdInputs.length > 0) {
        cy.get('input[type="password"]').first().type(bureauPassword, { force: true });
        cy.log('✅ Password saisi dans input[type="password"]');
      } else {
        cy.log('❌ input[type="password"] pas trouvé');
      }
    });

    cy.screenshot('02-form-filled');

    // Soumettre le formulaire
    cy.get('button[type="submit"], button', { timeout: 2000 }).then(($buttons) => {
      if ($buttons.length > 0) {
        cy.get('button').first().click({ force: true });
        cy.log('✅ Bouton cliqué');
      }
    });

    // Attendre et capturer la page après login
    cy.wait(2000);
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.screenshot('03-after-login');

    // Afficher l'URL actuelle
    cy.url().then((url) => {
      cy.log(`📍 URL après login: ${url}`);
    });
  });
});
