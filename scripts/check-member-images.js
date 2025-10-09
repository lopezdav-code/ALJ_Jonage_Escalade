import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les données des membres et extraire les images
const clubMembersPath = path.join(__dirname, '../src/data/clubMembers.js');
const membersContent = fs.readFileSync(clubMembersPath, 'utf8');

// Extraire les noms de fichiers d'images (5ème colonne du CSV)
const lines = membersContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
const imageFiles = [];

lines.forEach((line, index) => {
  if (line.includes(';')) {
    const parts = line.split(';');
    if (parts.length >= 5 && parts[4] && parts[4].trim()) {
      const imageFile = parts[4].trim();
      if (imageFile.includes('.png') || imageFile.includes('.jpg') || imageFile.includes('.jpeg')) {
        imageFiles.push(imageFile);
      }
    }
  }
});

console.log('🔍 Analyse des images des membres...\n');

// Vérifier le dossier des images
const imagesDir = path.join(__dirname, '../public/assets/members/');
const existingFiles = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

console.log(`📁 Dossier des images: ${imagesDir}`);
console.log(`📊 Images référencées dans le code: ${imageFiles.length}`);
console.log(`📂 Fichiers présents dans le dossier: ${existingFiles.length}\n`);

// Images manquantes
const missingImages = imageFiles.filter(file => !existingFiles.includes(file));
if (missingImages.length > 0) {
  console.log('❌ Images manquantes:');
  missingImages.forEach(img => console.log(`   - ${img}`));
  console.log('');
}

// Images orphelines (dans le dossier mais pas référencées)
const orphanImages = existingFiles.filter(file => 
  file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
).filter(file => !imageFiles.includes(file));

if (orphanImages.length > 0) {
  console.log('🔸 Images orphelines (présentes mais non référencées):');
  orphanImages.forEach(img => console.log(`   - ${img}`));
  console.log('');
}

// Images avec problèmes d'encodage potentiels
const encodingIssues = imageFiles.filter(file => 
  file.includes('%') || file !== encodeURIComponent(decodeURIComponent(file))
);

if (encodingIssues.length > 0) {
  console.log('⚠️  Images avec problèmes d\'encodage potentiels:');
  encodingIssues.forEach(img => {
    console.log(`   - ${img}`);
    console.log(`     → Encodé: ${encodeURIComponent(img)}`);
  });
  console.log('');
}

// Résumé
if (missingImages.length === 0 && orphanImages.length === 0 && encodingIssues.length === 0) {
  console.log('✅ Tout semble en ordre ! Aucun problème détecté.');
} else {
  console.log('📋 Résumé:');
  console.log(`   - Images manquantes: ${missingImages.length}`);
  console.log(`   - Images orphelines: ${orphanImages.length}`);
  console.log(`   - Problèmes d'encodage: ${encodingIssues.length}`);
}

console.log('\n💡 Pour résoudre les erreurs d\'images:');
console.log('   1. Ajoutez les fichiers manquants dans public/assets/members/');
console.log('   2. Vérifiez l\'orthographe des noms de fichiers');
console.log('   3. Assurez-vous que les caractères spéciaux sont corrects');
console.log('   4. Utilisez le composant SafeMemberAvatar pour un affichage sécurisé');