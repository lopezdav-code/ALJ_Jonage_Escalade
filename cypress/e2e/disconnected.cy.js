/**
 * Tests E2E - Mode Déconnecté - Pages Publiques vs Privées
 * Teste l'accès aux pages publiques et privées sans authentification
 */

describe('1️⃣  Mode Déconnecté - Accès Public/Privé', () => {
  // Pages publiques - doivent s'afficher
  const publicPages = [
    { path: '/', name: 'Accueil/Actualités' },
    { path: '/news', name: 'Actualités' },
    { path: '/agenda', name: 'Agenda' },
    { path: '/contact', name: 'Contact' }
  ];

  // Pages privées - doivent afficher "Accès restreint"
  const privatePages = [
    { path: '/competitions', name: 'Compétitions' },
    { path: '/volunteers', name: 'Adhérents' },
    { path: '/site-settings', name: 'Réglages du site' },
    { path: '/admin-management', name: 'Gestion Admin' },
    { path: '/bureau-management', name: 'Gestion Bureau' },
    { path: '/attendance-recap', name: 'Récapitulatif présences' }
  ];

  describe('Pages Publiques Accessibles', () => {
    publicPages.forEach((page) => {
      it(`devrait afficher "${page.name}" sur ${page.path}`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier qu'il y a du contenu
        cy.get('h1, h2, main, nav', { timeout: 5000 }).should('exist');

        // Vérifier qu'il n'y a pas de message d'erreur d'accès
        cy.contains(/accès restreint|access denied|forbidden|non autorisé/i).should('not.exist');

        cy.screenshot(`public-${page.path.replace(/\//g, '-') || 'home'}`);
      });
    });
  });

  describe('Pages Privées Bloquées', () => {
    privatePages.forEach((page) => {
      it(`devrait bloquer l'accès à ${page.path} avec "Accès restreint"`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier qu'un message d'accès restreint s'affiche
        cy.contains(/accès restreint/i).should('be.visible');

        cy.screenshot(`blocked-${page.path.replace(/\//g, '-')}`);
      });
    });
  });
});
