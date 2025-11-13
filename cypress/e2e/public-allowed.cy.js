/**
 * Tests E2E - Pages Publiques Autorisées
 * Teste l'accès aux pages publiques sans authentification
 */

describe('📖 Pages Publiques Autorisées', () => {
  // Liste des pages accessibles sans authentification
  const allowedPages = [
    { path: '/', name: 'Accueil' },
    { path: '/news', name: 'Actualités' },
    { path: '/inscriptions', name: 'Inscriptions' },
    { path: '/schedule', name: 'Planning des cours' },
    { path: '/contact', name: 'Contact' }
  ];

  allowedPages.forEach((page) => {
    it(`devrait afficher "${page.name}" sur ${page.path}`, () => {
      cy.log(`📄 Test: ${page.name} (${page.path})`);

      cy.visit(page.path, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier qu'on n'a pas été redirigé vers une page d'authentification
      cy.url().should('not.include', '/login');
      cy.url().should('not.include', '/auth');
      cy.url().should('not.include', '/signin');

      // Vérifier qu'il y a du contenu
      cy.get('h1, h2, main, nav, [role="main"]', { timeout: 5000 }).should('exist');

      // Vérifier qu'il n'y a pas de formulaire de connexion
      cy.get('input[type="password"]').should('not.exist');

      cy.log(`✅ ${page.name} accessible`);
    });
  });
});
