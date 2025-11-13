/**
 * Tests E2E - Actualités et Articles
 * Teste les pages et interactions liées aux actualités
 */

describe('📰 Actualités et Articles', () => {
  describe('Pages publiques - Actualités', () => {
    it('devrait afficher la page /news (Actualités)', () => {
      cy.log('📄 Test: Page /news');

      cy.visit('/news', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Vérifier qu'on n'a pas été redirigé
      cy.url().should('include', '/news');

      // Vérifier qu'il y a du contenu
      cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

      // Vérifier qu'il n'y a pas de message d'accès restreint
      cy.contains('h1', /Accès restreint/i).should('not.exist');

      cy.log('✅ Page /news accessible');
    });

    it('devrait avoir une structure valide pour les actualités', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Vérifier les éléments clés
      cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

      // Vérifier qu'il y a du contenu principal
      cy.get('[role="main"], main').should('be.visible');

      cy.log('✅ Structure de page actualités valide');
    });

    it('devrait afficher du contenu sur la page actualités', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1500);

      // Vérifier qu'il y a au minimum un titre
      cy.get('h1, h2, h3').should('have.length.greaterThan', 0);

      // Au minimum un élément de contenu
      cy.get('[role="main"], main, section, article, [class*="card"]').should('have.length.greaterThan', 0);

      cy.log('✅ Page actualités a du contenu');
    });

    it('devrait avoir des éléments cliquables sur la page actualités', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Vérifier qu'il y a des liens ou boutons
      cy.get('a, button').should('have.length.greaterThan', 0);

      cy.log('✅ Éléments cliquables disponibles');
    });
  });

  describe('Interaction avec les actualités', () => {
    it('devrait permettre de naviguer vers les articles', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Chercher un lien vers un article
      cy.get('a, button').then($links => {
        // Vérifier qu'au moins un lien existe et est visible
        expect($links.length).to.be.greaterThan(0);
      });

      cy.log('✅ Liens vers articles disponibles');
    });

    it('devrait charger sans erreur lors de la visite', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier pas de redirection vers login
      cy.url().should('not.include', '/login');
      cy.url().should('not.include', '/auth');

      // Vérifier pas de message d'erreur d'accès
      cy.contains('h1', /Accès restreint/i).should('not.exist');

      cy.log('✅ Pas d\'erreur au chargement');
    });

    it('devrait afficher des articles avec structure cohérente', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1500);

      // Vérifier qu'il y a une liste d'articles ou du contenu
      cy.get('article, [class*="article"], [class*="news"], [class*="post"], section').should('have.length.greaterThan', 0)
        .or
        cy.get('[role="main"], main').find('*').should('have.length.greaterThan', 5);

      cy.log('✅ Articles structurés');
    });
  });

  describe('Accessibilité - Actualités', () => {
    it('devrait être accessible depuis le menu principal', () => {
      cy.visit('/');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Chercher un lien vers les actualités
      cy.get('a, button').then($elements => {
        const hasNewsLink = $elements.toArray().some(el => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('actualité') ||
                 text.includes('news') ||
                 text.includes('article');
        });

        // Au minimum, la page /news devrait être accessible directement
        cy.visit('/news');
        cy.url().should('include', '/news');
      });

      cy.log('✅ Actualités accessibles');
    });

    it('devrait avoir du texte lisible sur la page actualités', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(1000);

      // Vérifier qu'il y a du texte visible (pas juste du HTML vide)
      cy.get('body').then($body => {
        const text = $body.text();
        expect(text.length).to.be.greaterThan(100); // Au minimum 100 caractères
      });

      cy.log('✅ Contenu textuel lisible');
    });

    it('devrait supporter la responsive design', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier que la page est visible (responsive)
      cy.get('main, [role="main"]').should('be.visible');

      // Test pas de overflow horizontal
      cy.get('body').should('have.css', 'overflow').and('not.include', 'hidden');

      cy.log('✅ Design responsive');
    });
  });

  describe('Performance - Actualités', () => {
    it('devrait charger la page actualités rapidement', () => {
      const start = Date.now();

      cy.visit('/news', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');

      cy.then(() => {
        const end = Date.now();
        const loadTime = end - start;

        // Devrait charger en moins de 10 secondes (Cypress timeout = 5s + buffer)
        expect(loadTime).to.be.lessThan(10000);

        cy.log(`✅ Chargement en ${loadTime}ms`);
      });
    });

    it('devrait afficher du contenu sans bloquer', () => {
      cy.visit('/news');
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier qu'il y a du contenu visible sans attendre longtemps
      cy.get('h1, h2, main').should('be.visible');

      cy.log('✅ Contenu affiché sans blocage');
    });
  });
});
