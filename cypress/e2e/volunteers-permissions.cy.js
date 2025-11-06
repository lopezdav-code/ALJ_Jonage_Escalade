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
          // Chercher des éléments qui contiennent des noms complets (au moins 2-3 lettres)
          // La page devrait afficher des noms comme "Dupont", "Martin", etc.
          cy.get('[data-testid*="member-name"], [class*="name"], h3, h4', { timeout: 5000 })
            .should('exist')
            .then(($elements) => {
              // Vérifier qu'il y a au moins des noms avec plus d'une lettre
              let hasFullNames = false;
              $elements.each((index, element) => {
                const text = Cypress.$(element).text().trim();
                // Un nom complet devrait avoir au moins 3 caractères (ex: "Jean")
                if (text.length >= 3 && /[a-zA-Z]{2,}/.test(text)) {
                  hasFullNames = true;
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
          // Chercher des éléments de noms
          cy.get('[data-testid*="member-name"], [class*="name"], h3, h4', { timeout: 5000 })
            .should('exist')
            .then(($elements) => {
              // Vérifier qu'il y a au moins quelques noms masqués (première lettre + point)
              let hasMaskedNames = false;
              $elements.each((index, element) => {
                const text = Cypress.$(element).text().trim();
                // Un nom masqué devrait être au format "M." ou "D." (une lettre + point)
                if (/^[A-Z]\.$/.test(text)) {
                  hasMaskedNames = true;
                }
              });

              // Au moins certains noms devraient être masqués
              expect(hasMaskedNames).to.be.true;
            });
        });

        it(`ne devrait PAS voir de noms complets pour ${role}`, () => {
          // Les noms complets comme "Dupont" ou "Martin" ne devraient pas être visibles
          cy.get('[data-testid*="member-name"], [class*="name"]', { timeout: 5000 })
            .each(($element) => {
              const text = Cypress.$(element).text().trim();

              // Un nom masqué ne devrait pas contenir plus qu'une lettre + point
              // Exceptions: les mots courants qui ne sont pas des noms (et, ou, la, etc)
              const commonWords = ['et', 'ou', 'la', 'le', 'de', 'en', 'à'];

              if (text.length > 1 && !commonWords.includes(text.toLowerCase())) {
                // Si c'est un nom, il devrait être masqué
                expect(text).to.match(/^[A-Z]\.$/, `Le nom "${text}" devrait être masqué (format "X.")`);
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
    it('devrait afficher plus d\'informations à un admin qu\'à un encadrant', () => {
      // Ouvrir deux fenêtres: une en tant qu'admin, une en tant qu'encadrant
      let adminPageText = '';
      let encadrantPageText = '';

      // 1. Connecter en tant qu'admin et capturer le texte
      cy.loginAsUser('admin');
      cy.visit('/volunteers');
      cy.get('body', { timeout: 5000 }).then(($body) => {
        adminPageText = $body.text();
      });

      // 2. Se déconnecter et reconnecter en tant qu'encadrant
      cy.loginAsUser('encadrant');
      cy.visit('/volunteers');
      cy.get('body', { timeout: 5000 }).then(($body) => {
        encadrantPageText = $body.text();

        // L'admin devrait voir plus de caractères (noms complets vs masqués)
        expect(adminPageText.length).to.be.greaterThan(encadrantPageText.length);

        // L'admin devrait voir des noms avec plus de 2-3 caractères
        // L'encadrant devrait voir surtout des "X." (1 lettre + point)
        const adminFullNameCount = (adminPageText.match(/[A-Z][a-z]{2,}/g) || []).length;
        const encadrantMaskedNameCount = (encadrantPageText.match(/\b[A-Z]\.\b/g) || []).length;

        expect(adminFullNameCount).to.be.greaterThan(0);
        expect(encadrantMaskedNameCount).to.be.greaterThan(0);
      });
    });
  });

  /**
   * Test de sécurité: Vérifier qu'il n'y a pas de fuite d'informations
   */
  describe('Sécurité - Pas de fuite d\'informations', () => {
    it('un adhérent ne devrait pas pouvoir voir les noms complets même en inspectant le HTML', () => {
      cy.loginAsUser('adherent');
      cy.visit('/volunteers');

      // Chercher dans le contenu HTML brut (style, data-attributes, etc)
      cy.get('*', { timeout: 5000 }).then(($elements) => {
        let fullNamesFound = false;

        $elements.each((index, element) => {
          // Chercher dans tous les attributs
          const attributes = element.attributes;
          for (let attr of attributes) {
            const value = attr.value;
            // Chercher des patterns de noms complets (Min 3 lettres consécutives)
            if (/[A-Z][a-z]{2,}\s[A-Z][a-z]{2,}/.test(value)) {
              fullNamesFound = true;
            }
          }
        });

        // Les noms complets ne devraient pas être visibles pour un adhérent
        expect(fullNamesFound).to.be.false;
      });
    });
  });
});
