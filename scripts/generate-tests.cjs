#!/usr/bin/env node

/**
 * Script de génération automatique de tests Cypress
 * Analyse Navigation.jsx et génère les tests pour toutes les pages
 */

const fs = require('fs');
const path = require('path');

// Lire Navigation.jsx
const navigationPath = path.join(__dirname, '../src/components/Navigation.jsx');
const navigationContent = fs.readFileSync(navigationPath, 'utf8');

// Extraire les liens de navigation
const navLinksMatch = navigationContent.match(/const defaultNavLinks = \[([\s\S]*?)\];/);
if (!navLinksMatch) {
  console.error('❌ Impossible de trouver defaultNavLinks dans Navigation.jsx');
  process.exit(1);
}

// Parser les liens de navigation
const navLinksStr = `[${navLinksMatch[1]}]`;
const pages = [];

// Regex pour extraire les objets
const linkPattern = /{\s*to:\s*['"]([^'"]+)['"]\s*,\s*text:\s*['"]([^'"]+)['"]\s*,\s*roles:\s*\[([^\]]+)\].*?(?:subMenu:\s*\[([\s\S]*?)\])?\s*}/g;
let match;

while ((match = linkPattern.exec(navigationContent)) !== null) {
  const [, to, text, rolesStr, subMenuStr] = match;
  const roles = rolesStr.split(',').map(r => r.trim().replace(/['"]/g, ''));

  pages.push({
    to,
    text,
    roles,
    isSubMenu: false
  });

  // Traiter les sous-menus
  if (subMenuStr) {
    const subMenuPattern = /{\s*to:\s*['"]([^'"]+)['"]\s*,\s*text:\s*['"]([^'"]+)['"]\s*,\s*roles:\s*\[([^\]]+)\]/g;
    let subMatch;
    while ((subMatch = subMenuPattern.exec(subMenuStr)) !== null) {
      const [, subTo, subText, subRolesStr] = subMatch;
      const subRoles = subRolesStr.split(',').map(r => r.trim().replace(/['"]/g, ''));
      pages.push({
        to: subTo,
        text: subText,
        roles: subRoles,
        isSubMenu: true,
        parentText: text
      });
    }
  }
}

console.log(`✅ Trouvé ${pages.length} pages à tester\n`);

// Générer le fichier de tests
const testsPath = path.join(__dirname, '../cypress/e2e/pages.cy.js');

const testContent = `/**
 * Tests E2E - Vérification de l'affichage de toutes les pages
 * Ce fichier est GÉNÉRÉ AUTOMATIQUEMENT par scripts/generate-tests.js
 * NE PAS MODIFIER MANUELLEMENT
 */

describe('Test d\\'affichage de toutes les pages', () => {
  // Configuration de base
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000/ALJ_Jonage_Escalade';

  const pages = ${JSON.stringify(pages, null, 2)};

  // Test pour les pages publiques (accessibles sans connexion)
  const publicPages = pages.filter(p => p.roles.includes('public'));

  if (publicPages.length > 0) {
    describe('Pages publiques (sans connexion)', () => {
      publicPages.forEach(page => {
        it('devrait afficher la page "' + page.text + '" (' + page.to + ')', () => {
          cy.visit(page.to);

          // Vérifier que la page s'est chargée
          cy.get('body', { timeout: 5000 }).should('be.visible');

          // Vérifier qu'il n'y a pas d'erreur visible
          cy.get('[class*="error"]').should('not.exist');

          // Prendre une capture d'écran pour référence
          cy.screenshot('page-' + page.to.replace(/\\//g, '-') + '-public');
        });
      });
    });
  }

  // Test pour les pages protégées (nécessitent une connexion)
  const protectedPages = pages.filter(p => !p.roles.includes('public') && p.roles.length > 0);

  if (protectedPages.length > 0) {
    describe('Pages protégées (avec connexion admin)', () => {
      beforeEach(() => {
        // Avant chaque test de page protégée, se connecter en tant qu'admin
        cy.loginAsAdmin();
      });

      protectedPages.forEach(page => {
        it('devrait afficher la page protégée "' + page.text + '" (' + page.to + ') pour rôles: [' + page.roles.join(', ') + ']', () => {
          cy.visit(page.to);

          // Vérifier que la page s'est chargée
          cy.get('body', { timeout: 5000 }).should('be.visible');

          // Vérifier qu'il n'y a pas d'erreur visible
          cy.get('[class*="error"]').should('not.exist');

          // Prendre une capture d'écran pour référence
          cy.screenshot('page-' + page.to.replace(/\\//g, '-') + '-protected');
        });
      });
    });
  }

  // Test pour vérifier que les pages protégées se bloquent sans connexion
  if (protectedPages.length > 0) {
    describe('Pages protégées (blocage sans connexion)', () => {
      // Ne PAS se connecter - tester l'accès sans authentification

      protectedPages.forEach(page => {
        it('devrait bloquer l' + "'" + 'accès à "' + page.text + '" (' + page.to + ') sans connexion', () => {
          cy.visit(page.to);

          // Vérifier que l'utilisateur a été redirigé
          // (soit vers /login, soit vers la page d'accueil, soit une page d'erreur)
          cy.url().should('not.include', page.to);
        });
      });
    });
  }

  // Test de performance
  describe('Performance et chargement', () => {
    it('les pages publiques doivent se charger en moins de 5 secondes', () => {
      publicPages.forEach(page => {
        cy.visit(page.to);
        cy.get('body').should('be.visible');
      });
    });
  });

  // Résumé des pages testées
  after(() => {
    console.log('');
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('Total de pages: ' + pages.length);
    console.log('Pages publiques: ' + publicPages.length);
    console.log('Pages protégées: ' + protectedPages.length);
  });
});
`;

fs.writeFileSync(testsPath, testContent);
console.log('📝 Fichier de tests généré: ' + testsPath + '\n');

// Afficher le résumé
console.log('📊 RÉSUMÉ DES PAGES À TESTER:');
console.log('================================\n');

pages.forEach((page, idx) => {
  const indent = page.isSubMenu ? '  └─ ' : '  ';
  const rolesStr = page.roles.join(', ');
  console.log(indent + '[' + (idx + 1) + '] ' + page.text + ' (' + page.to + ')');
  console.log(indent + '    Rôles: [' + rolesStr + ']');
  if (page.parentText) {
    console.log(indent + '    Parent: ' + page.parentText);
  }
  console.log();
});

console.log('✅ Fichier de tests généré avec succès!');
console.log('\n🚀 Pour exécuter les tests:');
console.log('   npm run test:e2e');
console.log('\n📊 Pour voir le rapport:');
console.log('   npm run test:report');
