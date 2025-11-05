#!/usr/bin/env node

/**
 * Script pour fusionner les rapports Mochawesome
 * Combine tous les rapports JSON en un seul rapport HTML
 */

const { merge } = require('mochawesome-merge');
const { generate } = require('mochawesome-report-generator');
const path = require('path');
const fs = require('fs');

const reportDir = path.join(__dirname, '../cypress/reports/mochawesome');
const outputFile = path.join(reportDir, 'mochawesome.json');
const htmlFile = path.join(reportDir, 'mochawesome.html');

// Vérifier que le répertoire existe
if (!fs.existsSync(reportDir)) {
  console.log('❌ Aucun rapport trouvé dans ' + reportDir);
  process.exit(1);
}

// Fusionner les rapports JSON
merge({
  files: [reportDir + '/**/*.json']
})
.then(merged => {
  // Générer le rapport HTML
  generate({
    data: merged,
    reportDir: reportDir,
    reportFilename: 'mochawesome',
    inline: false,
    timestamp: 'mmm d, yyyy, h:MM:ss TT'
  });

  console.log('✅ Rapport fusionné avec succès!');
  console.log('📊 Rapport HTML: ' + htmlFile);
  console.log('\n🔗 Ouvrez ce fichier dans votre navigateur pour voir les résultats:');
  console.log('   ' + htmlFile);
})
.catch(err => {
  console.error('❌ Erreur lors de la fusion des rapports:', err);
  process.exit(1);
});
