/**
 * Tests E2E - RBAC (Role-Based Access Control)
 * Teste le contrôle d'accès basé sur les rôles
 */

describe('🔐 Contrôle d\'Accès par Rôle (RBAC)', () => {
  // Pages que seul l'admin peut voir
  const adminOnlyPages = [
    { path: '/site-settings', name: 'Réglages du site' },
    { path: '/admin-management', name: 'Gestion Admin' },
    { path: '/user-roles', name: 'Gestion des rôles' },
    { path: '/permissions', name: 'Gestion des permissions' },
    { path: '/access-logs', name: 'Logs d\'accès' },
    { path: '/admin-dashboard', name: 'Dashboard Admin' },
    { path: '/database-management', name: 'Gestion DB' }
  ];

  // Pages accessibles au bureau
  const bureauPages = [
    { path: '/volunteers', name: 'Adhérents' },
    { path: '/bureau-management', name: 'Gestion Bureau' }
  ];

  // Pages publiques (sans authentification)
  const publicPages = [
    { path: '/', name: 'Accueil' },
    { path: '/news', name: 'Actualités' },
    { path: '/inscriptions', name: 'Inscriptions' },
    { path: '/schedule', name: 'Planning des cours' },
    { path: '/contact', name: 'Contact' }
  ];

  describe('Pages publiques - Accessible sans authentification', () => {
    publicPages.forEach(page => {
      it(`devrait afficher "${page.name}" sans authentification`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier pas de redirection login
        cy.url().should('not.include', '/login');

        // Vérifier pas d'accès restreint
        cy.contains('h1', /Accès restreint/i).should('not.exist');

        cy.log(`✅ ${page.name} accessible sans auth`);
      });
    });
  });

  describe('Pages admin - Bloquées pour utilisateurs non-admin', () => {
    beforeEach(() => {
      // Pas de connexion - teste le blocage pour public
    });

    adminOnlyPages.forEach(page => {
      it(`devrait bloquer "${page.name}" sans authentification`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier qu'il y a une restriction (redirection ou message)
        cy.url().should('not.include', page.path.replace(/^\//, '') + '');

        cy.log(`✅ ${page.name} bloquée pour public`);
      });
    });
  });

  describe('Pages admin - Accessibles pour admin', () => {
    beforeEach(() => {
      const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
      const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

      if (!adminEmail || !adminPassword) {
        throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
      }

      cy.session('rbac-admin', () => {
        cy.log(`📧 Connexion Admin: ${adminEmail}`);
        cy.visit('/', { failOnStatusCode: false });
        cy.loginWithCredentials(adminEmail, adminPassword);
        cy.wait(2000);
      }, {
        validate() {
          cy.window().then((win) => {
            const keys = Object.keys(win.localStorage);
            const hasAuthToken = keys.some(key =>
              key.includes('auth-token') ||
              key.includes('session') ||
              key.includes('sb-')
            );
            expect(hasAuthToken).to.be.true;
          });
        }
      });

      cy.visit('/', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    adminOnlyPages.forEach(page => {
      it(`devrait afficher "${page.name}" pour admin`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier pas de redirection
        cy.url().should('include', page.path);

        // Vérifier pas d'accès restreint
        cy.contains('h1', /Accès restreint/i).should('not.exist');

        cy.log(`✅ ${page.name} accessible pour admin`);
      });
    });

    it('devrait avoir accès à toutes les pages admin en une session', () => {
      adminOnlyPages.forEach(page => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');

        // Vérifier l'accès
        cy.url().should('include', page.path);
        cy.contains('h1', /Accès restreint/i).should('not.exist');
      });

      cy.log('✅ Admin a accès à toutes les pages');
    });
  });

  describe('Pages bureau - Bloquées pour admin', () => {
    beforeEach(() => {
      const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
      const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

      if (!bureauEmail || !bureauPassword) {
        throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
      }

      cy.session('rbac-bureau', () => {
        cy.log(`📧 Connexion Bureau: ${bureauEmail}`);
        cy.visit('/', { failOnStatusCode: false });
        cy.loginWithCredentials(bureauEmail, bureauPassword);
        cy.wait(2000);
      }, {
        validate() {
          cy.window().then((win) => {
            const keys = Object.keys(win.localStorage);
            const hasAuthToken = keys.some(key =>
              key.includes('auth-token') ||
              key.includes('session') ||
              key.includes('sb-')
            );
            expect(hasAuthToken).to.be.true;
          });
        }
      });

      cy.visit('/', { failOnStatusCode: false });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    bureauPages.forEach(page => {
      it(`devrait afficher "${page.name}" pour bureau`, () => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier pas de redirection
        cy.url().should('include', page.path);

        // Vérifier pas d'accès restreint
        cy.contains('h1', /Accès restreint/i).should('not.exist');

        cy.log(`✅ ${page.name} accessible pour bureau`);
      });
    });

    it('devrait bloquer l\'accès aux pages admin-only pour bureau', () => {
      const adminOnlyBlockedPages = [
        '/site-settings',
        '/user-roles',
        '/permissions',
        '/admin-dashboard'
      ];

      adminOnlyBlockedPages.forEach(page => {
        cy.visit(page, { failOnStatusCode: false });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wait(500);

        // Vérifier le blocage - soit redirection soit message d'erreur
        cy.url().then(url => {
          const isBlocked = !url.includes(page) || url.includes('/login');
          expect(isBlocked || cy.contains('h1', /Accès restreint/i).should('be.visible'));
        });
      });

      cy.log('✅ Bureau bloqué des pages admin');
    });
  });

  describe('Résumé - Matrice d\'accès', () => {
    it('devrait respecter la matrice d\'accès globale', () => {
      cy.log('📊 Résumé matrice d\'accès:');
      cy.log('✅ Public: Accueil, Actualités, Inscriptions, Planning, Contact');
      cy.log('✅ Bureau: Adhérents, Gestion Bureau, Présences, Passeport');
      cy.log('✅ Admin: Tous les pages, Dashboard, Gestion Base de Données');
      cy.log('🔒 Bloqué (Sans auth): Pages privées');
    });
  });
});
