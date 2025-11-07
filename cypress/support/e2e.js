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
  // Aller sur la page de login ou d'accueil
  cy.visit('/', { failOnStatusCode: false });

  // Chercher et remplir le champ email
  cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 5000 })
    .should('exist')
    .type(email);

  // Chercher et remplir le champ password
  cy.get('input[type="password"], input[name="password"], input[placeholder*="password" i]', { timeout: 5000 })
    .should('exist')
    .type(password);

  // Soumettre le formulaire - essayer plusieurs sélecteurs possibles
  cy.get('button[type="submit"]', { timeout: 5000 }).then(($buttons) => {
    if ($buttons.length > 0) {
      cy.get('button[type="submit"]').first().click();
    } else {
      // Alternative: chercher par texte
      cy.contains('button', /connexion|se connecter|login|sign in/i).click();
    }
  });

  // Attendre que la page se charge après login
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('[class*="loader"], [class*="loading"]', { timeout: 10000 }).should('not.exist');
});

// Attendre que la page se charge complètement
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('[class*="loader"], [class*="loading"]', { timeout: 2000 }).should('not.be.visible');
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
  // Désactiver les erreurs non bloquantes
  cy.on('uncaught:exception', (err) => {
    // Ignorer certaines erreurs
    if (err.message.includes('ResizeObserver')) {
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
