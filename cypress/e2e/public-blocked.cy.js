/**
 * Tests E2E - Pages Publiques Bloquées
 * Teste le blocage des pages privées sans authentification
 */

describe('🔒 Pages Publiques Bloquées', () => {
  // Liste des pages privées qui doivent être bloquées
  const blockedPages = [
    { path: '/competitions', name: 'Compétitions' },
    { path: '/volunteers', name: 'Adhérents' },
    { path: '/site-settings', name: 'Réglages du site' },
    { path: '/admin-management', name: 'Gestion Admin' },
    { path: '/bureau-management', name: 'Gestion Bureau' },
    { path: '/attendance-recap', name: 'Récapitulatif présences' }
  ];

  blockedPages.forEach((page) => {
    it(`devrait bloquer l'accès à "${page.name}" sur ${page.path}`, () => {
      cy.log(`📄 Test: Blocage ${page.name} (${page.path})`);

      cy.visit(page.path, { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.wait(500);

      // Vérifier qu'un message d'accès restreint s'affiche (dans le h1)
      cy.contains('h1', /Accès restreint/i).should('be.visible');

      cy.log(`✅ ${page.name} correctement bloquée`);
    });
  });
});
