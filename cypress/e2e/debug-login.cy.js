/**
 * Test de débogage - Vérifier la structure du formulaire de login
 * Aide à identifier les sélecteurs CSS corrects
 */

describe('🔍 Debug - Structure du formulaire de login', () => {
  it('devrait afficher la page d\'accueil et capturer la structure', () => {
    cy.visit('/', { failOnStatusCode: false });

    // Attendre que la page se charge
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Screenshot de la page entière
    cy.screenshot('debug-homepage-full');

    // Afficher la structure HTML
    cy.get('body').then(($body) => {
      cy.log('📄 HTML Body Structure:');
      cy.log($body.html().substring(0, 500));
    });

    // Chercher les inputs de formulaire
    cy.get('input').then(($inputs) => {
      cy.log(`Nombre d'inputs trouvés: ${$inputs.length}`);
      $inputs.each((index, input) => {
        cy.log(`Input ${index}: type="${input.type}", name="${input.name}", placeholder="${input.placeholder}"`);
      });
    });

    // Chercher les boutons
    cy.get('button').then(($buttons) => {
      cy.log(`Nombre de boutons trouvés: ${$buttons.length}`);
      $buttons.each((index, button) => {
        cy.log(`Button ${index}: type="${button.type}", text="${button.textContent.trim()}"`);
      });
    });

    // Chercher les formulaires
    cy.get('form').then(($forms) => {
      cy.log(`Nombre de formulaires trouvés: ${$forms.length}`);
      $forms.each((index, form) => {
        cy.log(`Form ${index}: id="${form.id}", class="${form.className}"`);
      });
    });

    // Chercher du texte "connexion", "login", etc
    cy.contains(/connexion|login|se connecter|password|mot de passe/i).then(($el) => {
      cy.log(`✅ Élément trouvé contenant "connexion/login": ${$el.text()}`);
    }).catch(() => {
      cy.log('❌ Aucun élément trouvé avec "connexion/login"');
    });
  });

  it('devrait lister tous les sélecteurs possibles pour le formulaire', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Test des différents sélecteurs possibles
    const selectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[type="text"]',
      'input[id*="email" i]',
      'input[id*="password" i]',
      'input[class*="email" i]',
      'input[class*="password" i]',
      'input:nth-of-type(1)',
      'input:nth-of-type(2)',
    ];

    selectors.forEach((selector) => {
      cy.get(selector).then(($els) => {
        if ($els.length > 0) {
          cy.log(`✅ Trouvé avec "${selector}": ${$els.length} élément(s)`);
          cy.log(`   Type: ${$els.attr('type')}, Name: ${$els.attr('name')}, ID: ${$els.attr('id')}`);
        } else {
          cy.log(`❌ Pas trouvé avec "${selector}"`);
        }
      });
    });
  });

  it('devrait vérifier la page après login', () => {
    const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
    const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

    if (!bureauEmail || !bureauPassword) {
      cy.log('⚠️ Variables TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD manquantes');
      return;
    }

    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');

    // Essayer de trouver et remplir les champs
    cy.get('input').first().then(($firstInput) => {
      cy.log(`Premier input trouvé: type="${$firstInput.attr('type')}", name="${$firstInput.attr('name')}"`);

      // Remplir le premier input avec l'email
      cy.get('input').first().type(bureauEmail);
    });

    cy.get('input').eq(1).then(($secondInput) => {
      cy.log(`Deuxième input trouvé: type="${$secondInput.attr('type')}", name="${$secondInput.attr('name')}"`);

      // Remplir le deuxième input avec le password
      cy.get('input').eq(1).type(bureauPassword);
    });

    // Chercher le bouton submit
    cy.get('button[type="submit"]').then(($btn) => {
      if ($btn.length > 0) {
        cy.log(`✅ Bouton submit trouvé`);
        cy.get('button[type="submit"]').first().click();
      } else {
        cy.log(`❌ Pas de button[type="submit"], cherche par texte...`);
        cy.contains('button', /connexion|login|send|submit/i).click();
      }
    });

    // Attendre la page après login
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.screenshot('debug-after-login');
  });
});
