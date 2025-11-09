/**
 * Cypress Support - Configuration et commandes globales
 */

// Authentification Supabase pour les tests avec rôle configurable
Cypress.Commands.add('loginAsUser', (role = 'admin') => {
  // Utilise UNIQUEMENT les variables d'environnement (depuis les secrets GitHub)
  const supabaseUrl = Cypress.env('VITE_SUPABASE_URL');
  const supabaseAnonKey = Cypress.env('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Variables d\'environnement manquantes: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY');
  }

  // Extraire l'ID du projet depuis l'URL Supabase
  // URL format: https://[project-id].supabase.co
  const projectId = supabaseUrl.split('//')[1].split('.')[0];

  // Créer une session mock selon le rôle
  const userConfig = {
    admin: {
      id: 'admin-test-user-id',
      email: 'admin@test.com',
      firstname: 'Admin',
      lastname: 'Test',
      role: 'admin'
    },
    bureau: {
      id: 'bureau-test-user-id',
      email: 'bureau@test.com',
      firstname: 'Bureau',
      lastname: 'Member',
      role: 'bureau'
    },
    encadrant: {
      id: 'encadrant-test-user-id',
      email: 'encadrant@test.com',
      firstname: 'Encadrant',
      lastname: 'Test',
      role: 'encadrant'
    },
    adherent: {
      id: 'adherent-test-user-id',
      email: 'adherent@test.com',
      firstname: 'Adherent',
      lastname: 'Test',
      role: 'adherent'
    }
  };

  const user = userConfig[role] || userConfig.admin;

  // Simuler l'authentification via localStorage
  const mockSession = {
    access_token: 'mock-token-for-testing',
    refresh_token: 'mock-refresh-token',
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        firstname: user.firstname,
        lastname: user.lastname
      }
    }
  };

  // Stocker la session dans localStorage avec la bonne clé
  cy.window().then((win) => {
    // La clé localStorage dépend de l'ID du projet Supabase
    const authKey = `sb-${projectId}-auth-token`;
    win.localStorage.setItem(authKey, JSON.stringify(mockSession));

    // Stocker aussi le rôle si nécessaire
    const profileKey = `profile-${user.id}`;
    win.localStorage.setItem(profileKey, JSON.stringify({ role: user.role }));
  });

  // Recharger la page pour que l'authentification soit appliquée
  cy.visit('/');
  cy.get('body', { timeout: 5000 }).should('be.visible');
});

// Alias pour compatibilité avec les tests existants
Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAsUser('admin');
});

// Authentification réelle avec email/password (depuis les secrets GitHub)
Cypress.Commands.add('loginWithCredentials', (email, password) => {
  // Aller sur la page de login dédiée
  cy.visit('/login', { failOnStatusCode: false });
  cy.get('body', { timeout: 5000 }).should('be.visible');

  // Remplir l'input email
  cy.get('input[type="email"]').type(email, { force: true });

  // Remplir l'input password
  cy.get('input[type="password"]').type(password, { force: true });

  // Cliquer sur le bouton de soumission
  cy.get('button[type="submit"]').click({ force: true });

  // Attendre la redirection vers la homepage (ou une autre page)
  cy.url({ timeout: 10000 }).should('not.include', '/login');

  // Attendre que la page se charge complètement
  cy.get('body', { timeout: 10000 }).should('be.visible');

  // Attendre que la session soit bien établie dans localStorage
  cy.window().then((win) => {
    const keys = Object.keys(win.localStorage);
    const authKeys = keys.filter(k => k.includes('sb-') || k.includes('auth'));
    cy.log(`📍 Clés localStorage: ${authKeys.join(', ')}`);

    cy.wrap(null).should(() => {
      // Vérifier que la session Supabase est bien établie
      const hasAuthToken = keys.some(key => key.includes('auth-token') || key.includes('session'));
      expect(hasAuthToken).to.be.true;
    }, { timeout: 10000 });
  });

  // Attendre que le contexte React mette à jour l'utilisateur
  // Cela se fait via l'onAuthStateChange de Supabase
  cy.get('body').should('exist');
  cy.wait(1500);
});

// Attendre que la page se charge complètement avec auto-reload en cas d'erreur Vite
Cypress.Commands.add('waitForPageLoad', () => {
  // Attendre que le body soit visible
  cy.get('body', { timeout: 10000 }).should('be.visible');

  // Attendre que la page se stabilise
  cy.wait(3000);

  // Vérifier si la page a du contenu ou est bloquée par une erreur Vite
  cy.get('body').then($body => {
    const hasSpinner = $body.find('.animate-spin').length > 0;
    const hasContent = $body.find('h1, h2, main, [role="main"]').length > 0;
    const hasErrorBoundary = $body.text().includes('error') ||
                              $body.text().includes('Something went wrong');

    // Si pas de contenu, spinner présent, ou erreur détectée → reload
    if (!hasContent || hasSpinner || hasErrorBoundary) {
      cy.log('⚠️ Page stuck, blank, or has error - forcing hard reload...');
      cy.reload(true);
      cy.wait(3000);

      // Vérifier à nouveau après le reload
      cy.get('body', { timeout: 10000 }).should('be.visible');
    }
  });
});

// Vérifier qu'une page s'affiche correctement
Cypress.Commands.add('checkPageLoad', (pageName) => {
  cy.get('body').should('be.visible');
  cy.get('h1, h2, [class*="title"], [class*="header"]').should('have.length.greaterThan', 0);
  cy.get('[class*="error"]').should('not.be.visible');
});

// Prendre une capture d'écran avec nom automatique
Cypress.Commands.add('saveScreenshot', (prefix = '') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = prefix ? `${prefix}-${timestamp}` : timestamp;
  cy.screenshot(name);
});

// Configuration globale
beforeEach(() => {
  // Gestion intelligente des erreurs non capturées
  cy.on('uncaught:exception', (err) => {
    // Ignorer les erreurs ResizeObserver (non critiques)
    if (err.message.includes('ResizeObserver')) {
      return false;
    }

    // Ignorer les erreurs de modules dynamiques (cache Vite corrompu)
    // Ces erreurs seront gérées automatiquement par waitForPageLoad()
    if (err.message.includes('Failed to fetch dynamically imported module') ||
        err.message.includes('Outdated Optimize Dep')) {
      // NE PAS exécuter de commandes Cypress ici - juste ignorer l'erreur
      // Le reload sera géré par waitForPageLoad() et les tests individuels
      return false;
    }

    return true;
  });
});

// Afficher les informations de test
afterEach(function () {
  if (this.currentTest.state === 'passed') {
    cy.log(`✅ Test réussi: ${this.currentTest.title}`);
  } else if (this.currentTest.state === 'failed') {
    cy.log(`❌ Test échoué: ${this.currentTest.title}`);
  }
});
