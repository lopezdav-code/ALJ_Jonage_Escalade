// Script pour encoder le logo en base64
const fs = require('fs');
const path = require('path');

// Chemin vers le logo (à créer)
const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo-alj.png');

if (fs.existsSync(logoPath)) {
  const imageBuffer = fs.readFileSync(logoPath);
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Image}`;
  
  console.log('Logo encodé en base64:');
  console.log(dataUri);
  
  // Sauvegarder dans un fichier
  fs.writeFileSync(
    path.join(__dirname, 'logo-base64.txt'),
    dataUri
  );
  console.log('\nLogo sauvegardé dans scripts/logo-base64.txt');
} else {
  console.error('Le fichier logo-alj.png n\'existe pas dans public/assets/');
}
