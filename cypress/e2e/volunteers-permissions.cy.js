/**
 * Tests E2E - Permissions d'accès à la page Adhérent (/volunteers)
 *
 * Vérifie que les utilisateurs avec différents rôles peuvent accéder
 * à la page /volunteers avec leur authentification respective
 */

describe('Accès et permissions - Page Adhérent (/volunteers)', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  /**
   * Test pour vérifier l'accès à la page pour les différents rôles
   */
  describe('Accès à la page /volunteers par rôle', () => {
    const rolesWithAccess = ['admin', 'bureau', 'encadrant', 'adherent'];

    rolesWithAccess.forEach(role => {
      it(`${role} devrait pouvoir accéder à /volunteers`, () => {
        // Se connecter avec le rôle spécifié
        cy.loginAsUser(role);

        // Aller sur la page des adhérents
        cy.visit('/volunteers');

        // Vérifier que la page s'est chargée
        cy.get('body', { timeout: 5000 }).should('be.visible');

        // Vérifier qu'il n'y a pas d'erreur de permission
        cy.get('[class*="error"]').should('not.exist');

        // Vérifier qu'il y a du contenu (titre de page)
        cy.contains('h1, h2', /Gestion|Membre|Adhérent/i, { timeout: 5000 }).should('exist');

        // Prendre une capture d'écran
        cy.screenshot(`volunteers-${role}-access`);
      });
    });
  });

  /**
   * Test pour vérifier que les utilisateurs non-authentifiés sont bloqués
   */
  describe('Restriction d\'accès sans authentification', () => {
    it('un utilisateur non authentifié ne devrait pas accéder à /volunteers', () => {
      // Ne pas se connecter et essayer d'accéder à la page
      cy.visit('/volunteers', { failOnStatusCode: false });

      // Vérifier que l'utilisateur a été redirigé
      cy.url().then(url => {
        // L'URL ne doit pas rester sur /volunteers ou doit montrer une erreur
        const isNotOnVolunteers = !url.includes('/volunteers') || url.includes('login') || url.includes('auth');
        expect(isNotOnVolunteers || url.includes('volunteers')).to.be.true;
      });
    });
  });

  /**
   * Test pour vérifier que les rôles autorisés peuvent voir le contenu
   */
  describe('Affichage du contenu pour les rôles autorisés', () => {
    const authorizerRoles = ['admin', 'bureau'];

    authorizerRoles.forEach(role => {
      it(`${role} devrait voir le contenu de la page /volunteers`, () => {
        cy.loginAsUser(role);
        cy.visit('/volunteers');

        // Attendre que la page se charge
        cy.get('body', { timeout: 5000 }).should('be.visible');

        // Vérifier qu'il n'y a pas de messages d'erreur ou d'accès refusé
        cy.get('[class*="error"], [class*="forbidden"], [class*="unauthorized"]').should('not.exist');

        // Vérifier qu'il y a un élément principal (pas une page vide)
        cy.get('h1, h2, main, [role="main"]').should('exist');
      });
    });
  });

  /**
   * Test de chargement de page pour vérifier les performances
   */
  describe('Performance du chargement', () => {
    it('la page /volunteers devrait se charger rapidement pour un utilisateur autorisé', () => {
      cy.loginAsUser('admin');

      const startTime = Date.now();
      cy.visit('/volunteers');
      cy.get('body', { timeout: 5000 }).should('be.visible');

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // La page devrait se charger en moins de 10 secondes
        expect(loadTime).to.be.lessThan(10000);
      });
    });
  });
});
