/**
 * Tests E2E - Contrôle d'accès par rôle
 * Test les pages publiques, pages Bureau et pages Admin
 */

// ============================================================================
// SUITE 1: Mode DÉCONNECTÉ - Pages Publiques vs Privées
// ============================================================================
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

// ============================================================================
// SUITE 2: Mode BUREAU - Pages Accessibles au Bureau
// ============================================================================
describe('2️⃣  Mode Bureau - Pages Accessibles', () => {
  beforeEach(() => {
    const bureauEmail = Cypress.env('TEST_BUREAU_EMAIL') || '';
    const bureauPassword = Cypress.env('TEST_BUREAU_PASSWORD') || '';

    if (!bureauEmail || !bureauPassword) {
      throw new Error('❌ Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD');
    }

    cy.log(`📧 Connexion Bureau: ${bureauEmail}`);
    cy.loginWithCredentials(bureauEmail, bureauPassword);
  });

  it('devrait afficher /volunteers (liste des adhérents)', () => {
    cy.visit('/volunteers');
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    // Vérifier qu'il n'y a pas de message d'accès restreint
    cy.contains(/accès restreint|access denied|forbidden/i).should('not.exist');

    cy.screenshot('bureau-volunteers');
  });

  it('devrait bloquer l\'accès à /site-settings (Admin only)', () => {
    cy.visit('/site-settings', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(500);

    // Devrait avoir un message d'accès restreint
    cy.contains(/accès restreint/i).should('be.visible');

    cy.screenshot('bureau-blocked-site-settings');
  });

  it('devrait afficher /bureau-management', () => {
    cy.visit('/bureau-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu ou un titre
    cy.get('h1, h2, main', { timeout: 5000 }).should('exist');

    cy.screenshot('bureau-management');
  });

  it('devrait bloquer l\'accès à /admin-management', () => {
    cy.visit('/admin-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(500);

    // Devrait avoir un message d'accès restreint
    cy.contains(/accès restreint/i).should('be.visible');

    cy.screenshot('bureau-blocked-admin-management');
  });
});

// ============================================================================
// SUITE 3: Mode ADMIN - Pages Accessibles à l'Admin
// ============================================================================
describe('3️⃣  Mode Admin - Pages Accessibles', () => {
  beforeEach(() => {
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || '';
    const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('❌ Variables manquantes: TEST_ADMIN_EMAIL ou TEST_ADMIN_PASSWORD');
    }

    cy.log(`📧 Connexion Admin: ${adminEmail}`);
    cy.loginWithCredentials(adminEmail, adminPassword);

    // Attendre que le profil soit complètement chargé
    // en visitant une page simple qui vérifie l'authentification
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(2000); // Attendre que le contexte React se mette à jour
  });

  it('devrait afficher /site-settings (Réglages du site)', () => {
    cy.visit('/site-settings');
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1500);

    // Vérifier le titre
    cy.contains(/réglages du site|site settings|configuration/i).should('be.visible');

    // Vérifier qu'il n'y a pas de message d'erreur d'accès restreint
    cy.contains(/accès restreint/i).should('not.exist');

    cy.screenshot('admin-site-settings');
  });

  it('devrait afficher /admin-management', () => {
    cy.visit('/admin-management', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-admin-management');
  });

  it('devrait afficher /user-roles (Gestion des rôles)', () => {
    cy.visit('/user-roles', { failOnStatusCode: false });

    // waitForPageLoad gère automatiquement le reload si la page est bloquée
    cy.waitForPageLoad();

    // Vérifier qu'il y a du contenu après le chargement
    cy.get('h1, h2, main', { timeout: 10000 }).should('exist');

    cy.screenshot('admin-user-roles');
  });

  it('devrait afficher /permissions (Gestion des permissions)', () => {
    cy.visit('/permissions', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-permissions');
  });

  it('devrait afficher /access-logs (Logs d\'accès)', () => {
    cy.visit('/access-logs', { failOnStatusCode: false });

    // waitForPageLoad gère automatiquement le reload si la page est bloquée
    cy.waitForPageLoad();

    // Vérifier qu'il y a du contenu après le chargement
    cy.get('h1, h2, main', { timeout: 10000 }).should('exist');

    cy.screenshot('admin-access-logs');
  });

  it('devrait afficher /volunteers (Adhérents)', () => {
    cy.visit('/volunteers');
    cy.get('body', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Vérifier qu'il y a du contenu
    cy.get('h1, h2, main, [role="main"]', { timeout: 5000 }).should('exist');

    cy.screenshot('admin-volunteers');
  });
});
