// Script d'extraction et d'injection des fiches pédagogiques avec Ghostscript + OCR
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import PDFImage from 'pdf-image';
import Tesseract from 'tesseract.js';
import { supabase } from '../src/lib/customSupabaseClient.js';
import sharp from 'sharp';

const PDF_PATH = 'C:\\Users\\a138672\\Downloads\\JEUX en ESCALADE.pdf';
const START_PAGE = 36; // Première page avec les fiches
const BUCKET_NAME = 'pedagogy_files';
const TEST_MODE = false; // ✅ MODE PRODUCTION : import tous les fiches (changez à true pour tester)
const TEMP_DIR = './temp_pdf_images';

// Créer le répertoire temporaire
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Fonction pour vérifier que Ghostscript est disponible
function checkGhostscript() {
  try {
    execSync('gs -version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Fonction pour extraire une page du PDF en tant qu'image PNG
async function extractPageAsImage(pdfPath, pageNumber) {
  console.log(`    🖼️  Extraction de la page ${pageNumber} en image...`);

  try {
    const pdfImage = new PDFImage.PDFImage(pdfPath, {
      convertOptions: {
        '-density': '150',
        '-quality': '85',
      },
    });

    const imagePath = await pdfImage.convertPage(pageNumber - 1); // 0-based index
    console.log(`    ✅ Image extraite: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error(`    ❌ Erreur extraction:`, error.message.substring(0, 100));
    return null;
  }
}

// Fonction pour parser une fiche pédagogique depuis le texte
function parsePedagogySheet(text) {
  console.log('  📋 Parsing du texte OCR...');

  // Nettoyer le texte
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const cleanText = lines.join('\n');

  // Patterns de recherche pour texte OCR (plus flexibles)
  const patterns = {
    title: /(?:Titre|TITRE)[:\s]*([^\n]+?)(?=(?:\n|Dispositif|DISPOSITIF|But|BUT))/is,
    description: /(?:Dispositif|DISPOSITIF)[:\s]*([^\n]+?)(?=(?:\n|But|BUT|Consigne))/is,
    game_goal: /(?:But|BUT)[:\s]*([^\n]+?)(?=(?:\n|Consigne|CONSIGNE))/is,
    starting_situation: /(?:Consigne|CONSIGNE)[:\s]*([^\n]+?)(?=(?:\n|Critère|CRITERE|Variante))/is,
    success_criteria:
      /(?:Critère.*?réussite|CRITERE.*?REUSSITE|Critères.*?réussite)[:\s]*([^\n]+?)(?=(?:\n|Variante|VARIANTE|$))/is,
    evolution: /(?:Variante|VARIANTE)[:\s]*([^\n]+?)$/is,
  };

  const result = {};

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let value = match[1].trim();
      // Limiter à 1000 caractères
      if (value.length > 1000) {
        value = value.substring(0, 1000) + '...';
      }
      result[key] = value;
      console.log(`    ✓ ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    } else {
      result[key] = null;
      console.log(`    ✗ ${key}: non trouvé`);
    }
  }

  return result;
}

// Fonction pour uploader une image dans Supabase Storage
async function uploadImage(imagePath) {
  const fileName = `pedagogy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;

  try {
    console.log(`    📤 Upload de l'image...`);

    let fileBuffer = fs.readFileSync(imagePath);

    // Optimiser l'image avec sharp
    const optimizedBuffer = await sharp(fileBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80 })
      .toBuffer();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) throw error;

    console.log(`    ✅ Image uploadée: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error(`    ❌ Erreur upload:`, error.message);
    return null;
  }
}

// Fonction principale d'import
async function importPedagogySheets() {
  console.log('🚀 Début de l\'extraction des fiches pédagogiques (Ghostscript + OCR)');
  console.log(`📄 Fichier: ${PDF_PATH}`);
  console.log(`📍 À partir de la page: ${START_PAGE}\n`);

  // Vérifier que Ghostscript est disponible
  if (!checkGhostscript()) {
    console.error('❌ Ghostscript n\'est pas installé ou disponible');
    console.error(`\n📦 Installation de Ghostscript :\n`);
    console.error(`   1. Téléchargez Ghostscript depuis: https://www.ghostscript.com/download/gsdnload.html`);
    console.error(`   2. Installez la version "GPL Ghostscript XXXX.XX (64-bit)"`);
    console.error(`   3. Redémarrez le terminal après installation`);
    console.error(`   4. Réexécutez ce script\n`);
    return;
  }

  console.log('✅ Ghostscript disponible\n');

  // Vérifier que le fichier existe
  if (!fs.existsSync(PDF_PATH)) {
    console.error('❌ Fichier PDF introuvable!');
    return;
  }

  console.log('✅ Fichier trouvé');
  const totalPages = 71; // D'après le PDF chargé précédemment

  console.log(`📍 Traitement des pages ${START_PAGE} à ${totalPages}\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Calculer le nombre de fiches (une fiche = 2 pages : image + texte)
  const maxFiches = Math.floor((totalPages - START_PAGE + 1) / 2);
  console.log(`📊 Nombre estimé de fiches: ${maxFiches}\n`);

  // Initialiser Tesseract une seule fois (pour performance)
  console.log('⏳ Initialisation de Tesseract.js...');
  const worker = await Tesseract.createWorker('fra');
  console.log('✅ Tesseract prêt\n');

  // Boucler sur les pages (paires = images, impaires = description)
  for (let ficheIndex = 0; ficheIndex < maxFiches; ficheIndex++) {
    const imagePageNum = START_PAGE + ficheIndex * 2; // Numéro de page humain (1-based)
    const textPageNum = imagePageNum + 1;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📌 Fiche ${ficheIndex + 1}/${maxFiches}`);
    console.log(`   📷 Image: page ${imagePageNum}`);
    console.log(`   📝 Texte: page ${textPageNum}`);
    console.log(`${'='.repeat(60)}`);

    try {
      // 1. Extraire l'image de la page paire
      console.log(`  📷 Extraction de l'image...`);
      const imagePath = await extractPageAsImage(PDF_PATH, imagePageNum);

      if (!imagePath) {
        console.log('  ⚠️  Impossible d\'extraire l\'image, fiche ignorée');
        errorCount++;
        continue;
      }

      // 2. Faire l'OCR sur l'image de la page paire (qui contient aussi le texte)
      console.log(`  📖 OCR en cours...`);
      const imageText = await worker.recognize(imagePath);
      const descriptiveText = imageText.data.text;

      if (!descriptiveText || descriptiveText.length < 50) {
        console.log('  ⚠️  Texte OCR trop court ou vide, fiche ignorée');
        errorCount++;
        // Nettoyer
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
        continue;
      }

      console.log(`  📝 Texte OCR extrait: ${descriptiveText.length} caractères`);

      // 3. Parser les informations de la fiche
      const sheetData = parsePedagogySheet(descriptiveText);

      if (!sheetData.title) {
        console.log('  ⚠️  Titre non trouvé après OCR, fiche ignorée');
        errors.push({ fiche: ficheIndex + 1, error: 'Titre manquant après OCR' });
        errorCount++;
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
        continue;
      }

      console.log(`\n  ✨ Titre: "${sheetData.title}"`);

      // 4. Uploader l'image dans Supabase
      console.log(`  📤 Upload de l'image...`);
      const imageName = await uploadImage(imagePath);

      if (!imageName) {
        console.log('  ⚠️  Impossible d\'uploader l\'image');
        errors.push({ fiche: ficheIndex + 1, error: 'Erreur upload image' });
        errorCount++;
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
        continue;
      }

      // 5. Insérer dans la base de données
      console.log(`  💾 Insertion dans la BDD...`);

      const { error: dbError } = await supabase.from('pedagogy_sheets').insert({
        title: sheetData.title,
        description: sheetData.description,
        game_goal: sheetData.game_goal,
        starting_situation: sheetData.starting_situation,
        success_criteria: sheetData.success_criteria,
        evolution: sheetData.evolution,
        sheet_type: 'educational_game',
        structure: 'SAE',
        type: 'image_file',
        url: imageName,
        illustration_image: imageName,
      });

      if (dbError) {
        console.error(`  ❌ Erreur BDD:`, dbError.message);
        errors.push({ fiche: ficheIndex + 1, error: dbError.message });
        errorCount++;
      } else {
        console.log(`  ✅ Fiche insérée avec succès!`);
        successCount++;
      }

      // Nettoyer l'image temporaire
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {}
    } catch (error) {
      console.error(`  ❌ Erreur lors du traitement:`, error.message);
      errors.push({ fiche: ficheIndex + 1, error: error.message });
      errorCount++;
    }

    // Mode test : limiter à 5 fiches
    if (TEST_MODE && successCount + errorCount >= 5) {
      console.log(`\n⏸️  Mode TEST: arrêt après 5 fiches traitées`);
      break;
    }
  }

  // Terminer Tesseract
  await worker.terminate();

  // Résumé final
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DE L'IMPORT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Fiches importées avec succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Détails des erreurs:`);
    errors.forEach((err) => {
      console.log(`   - Fiche ${err.fiche}: ${err.error}`);
    });
  }

  console.log(`${'='.repeat(60)}\n`);

  if (TEST_MODE) {
    console.log(
      `💡 Mode TEST activé. Pour importer toutes les fiches, modifiez TEST_MODE = false dans le script.\n`
    );
  }

  // Nettoyer le répertoire temporaire
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn('⚠️  Impossible de nettoyer le répertoire temporaire');
  }
}

// Exécution
console.log('🎯 Script d\'import des fiches pédagogiques (avec Ghostscript + OCR Tesseract.js)\n');
importPedagogySheets()
  .then(() => {
    console.log('✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
