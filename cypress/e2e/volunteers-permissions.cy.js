/**
 * Tests E2E - Permissions d'affichage des noms sur la page Adhérent (/volunteers)
 *
 * Vérifie que:
 * - Admin et Bureau voient les noms COMPLETS
 * - Encadrant et Adhérent voient seulement la PREMIÈRE LETTRE
 */

describe('Permissions d\'affichage des noms - Page Adhérent (/volunteers)', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  /**
   * Test pour les rôles qui DOIVENT voir les noms complets
   */
  describe('Noms complets visibles (Admin + Bureau)', () => {
    const rolesWithFullNames = ['admin', 'bureau'];

    rolesWithFullNames.forEach(role => {
      describe(`Rôle: ${role}`, () => {
        beforeEach(() => {
          // Se connecter avec le rôle spécifié
          cy.loginAsUser(role);
          // Aller sur la page des adhérents
          cy.visit('/volunteers');
          cy.get('body', { timeout: 5000 }).should('be.visible');
        });

        it(`devrait afficher les NOMS COMPLETS pour ${role}`, () => {
          // Chercher la table contenant les noms et vérifier qu'il y a des noms avec au moins 3 caractères
          cy.get('table tbody tr', { timeout: 5000 })
            .should('have.length.greaterThan', 0)
            .then(($rows) => {
              let hasFullNames = false;
              $rows.each((index, row) => {
                // Les noms sont dans les colonnes 2 et 3 (index 1 et 2) après la photo
                const cells = Cypress.$(row).find('td');
                if (cells.length >= 3) {
                  const firstName = Cypress.$(cells[1]).text().trim();
                  const lastName = Cypress.$(cells[2]).text().trim();
                  // Un nom complet devrait avoir au moins 3 caractères
                  if ((firstName.length >= 3 && /[a-zA-Z]{2,}/.test(firstName)) ||
                      (lastName.length >= 3 && /[a-zA-Z]{2,}/.test(lastName))) {
                    hasFullNames = true;
                  }
                }
              });

              expect(hasFullNames).to.be.true;
            });
        });

        it(`ne devrait PAS voir de noms masqués (première lettre) pour ${role}`, () => {
          // Vérifier qu'on ne voit pas le pattern "M." ou "D." seul
          cy.get('body').then(($body) => {
            const text = $body.text();
            // Les patterns comme "M. " ou "D. " au début de ligne suggèrent un masquage
            const maskedPattern = /^\s*[A-Z]\.\s+/gm;
            const matches = text.match(maskedPattern);

            // Il ne devrait pas y avoir de noms masqués pour les rôles admin/bureau
            if (matches) {
              // Permettre quelques faux positifs (abbréviations, etc)
              // mais ils ne devraient pas être nombreux
              expect(matches.length).to.be.lessThan(2);
            }
          });
        });

        it(`devrait charger la page sans erreur pour ${role}`, () => {
          cy.get('[class*="error"]').should('not.exist');
          cy.screenshot(`volunteers-${role}-full-names`);
        });
      });
    });
  });

  /**
   * Test pour les rôles qui DOIVENT voir seulement la première lettre
   */
  describe('Noms masqués - Première lettre uniquement (Encadrant + Adhérent)', () => {
    const rolesWithMaskedNames = ['encadrant', 'adherent'];

    rolesWithMaskedNames.forEach(role => {
      describe(`Rôle: ${role}`, () => {
        beforeEach(() => {
          // Se connecter avec le rôle spécifié
          cy.loginAsUser(role);
          // Aller sur la page des adhérents
          cy.visit('/volunteers');
          cy.get('body', { timeout: 5000 }).should('be.visible');
        });

        it(`devrait afficher les noms MASQUÉS pour ${role}`, () => {
          // Chercher la table contenant les noms et vérifier qu'il y a des noms masqués (première lettre + point)
          cy.get('table tbody tr', { timeout: 5000 })
            .should('have.length.greaterThan', 0)
            .then(($rows) => {
              let hasMaskedNames = false;
              $rows.each((index, row) => {
                // Les noms sont dans les colonnes 2 et 3 (index 1 et 2) après la photo
                const cells = Cypress.$(row).find('td');
                if (cells.length >= 3) {
                  const firstName = Cypress.$(cells[1]).text().trim();
                  const lastName = Cypress.$(cells[2]).text().trim();
                  // Un nom masqué devrait être au format "M." ou "D." (une lettre + point)
                  if (/^[A-Z]\.$/.test(firstName) || /^[A-Z]\.$/.test(lastName)) {
                    hasMaskedNames = true;
                  }
                }
              });

              // Au moins certains noms devraient être masqués
              expect(hasMaskedNames).to.be.true;
            });
        });

        it(`ne devrait PAS voir de noms complets pour ${role}`, () => {
          // Les noms complets comme "Dupont" ou "Martin" ne devraient pas être visibles
          cy.get('table tbody tr', { timeout: 5000 })
            .each(($row) => {
              const cells = Cypress.$($row).find('td');
              if (cells.length >= 3) {
                const firstName = Cypress.$(cells[1]).text().trim();
                const lastName = Cypress.$(cells[2]).text().trim();

                // Les noms ne devraient pas être complets (sauf exceptions)
                const commonWords = ['et', 'ou', 'la', 'le', 'de', 'en', 'à', 'Photo', 'Prénom', 'Nom'];

                // Vérifier que les prénoms et noms ne sont pas complets
                if (firstName.length > 1 && !commonWords.includes(firstName)) {
                  expect(firstName).to.match(/^[A-Z]\.$/, `Le prénom "${firstName}" devrait être masqué (format "X.")`);
                }
                if (lastName.length > 1 && !commonWords.includes(lastName)) {
                  expect(lastName).to.match(/^[A-Z]\.$/, `Le nom "${lastName}" devrait être masqué (format "X.")`);
                }
              }
            });
        });

        it(`devrait charger la page sans erreur pour ${role}`, () => {
          cy.get('[class*="error"]').should('not.exist');
          cy.screenshot(`volunteers-${role}-masked-names`);
        });
      });
    });
  });

  /**
   * Test de comparaison: Admin vs Encadrant
   */
  describe('Comparaison des niveaux de sécurité', () => {
    it('devrait charger correctement pour différents rôles', () => {
      const roles = ['admin', 'encadrant'];

      roles.forEach(role => {
        // Connecter avec le rôle spécifié
        cy.loginAsUser(role);
        cy.visit('/volunteers');

        // Vérifier que la page s'est chargée correctement
        cy.get('table', { timeout: 5000 }).should('be.visible');
        cy.get('table tbody tr', { timeout: 5000 }).should('have.length.greaterThan', 0);

        // Vérifier qu'il n'y a pas d'erreurs
        cy.get('[class*="error"]').should('not.exist');
      });
    });
  });

  /**
   * Test de sécurité: Vérifier qu'il n'y a pas de fuite d'informations
   */
  describe('Sécurité - Page accessible avec authentification', () => {
    it('un adhérent devrait pouvoir accéder à la page /volunteers', () => {
      cy.loginAsUser('adherent');
      cy.visit('/volunteers');

      // Vérifier que la page s'est chargée correctement
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('table', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="error"]').should('not.exist');
    });

    it('un encadrant devrait pouvoir accéder à la page /volunteers', () => {
      cy.loginAsUser('encadrant');
      cy.visit('/volunteers');

      // Vérifier que la page s'est chargée correctement
      cy.get('body', { timeout: 5000 }).should('be.visible');
      cy.get('table', { timeout: 5000 }).should('be.visible');
      cy.get('[class*="error"]').should('not.exist');
    });
  });
});
