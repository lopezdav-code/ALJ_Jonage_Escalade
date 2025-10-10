/**
 * Script de diagnostic pour vérifier les validations récentes
 * et la mise à jour de la colonne passeport dans members
 * 
 * Usage: 
 * 1. Créer un fichier .env à la racine si pas encore fait
 * 2. node scripts/check-recent-validations.js
 */

import { createClient } from '@supabase/supabase-js';

// Remplacer par vos vraies valeurs depuis le fichier .env ou directement ici
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://uxdvrcahtijcjqkvtzxx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecentValidations() {
  console.log('🔍 Vérification des validations récentes...\n');

  try {
    // 1. Récupérer les 10 dernières validations
    console.log('📋 Dernières validations enregistrées:');
    const { data: validations, error: validError } = await supabase
      .from('passeport_validations')
      .select('*')
      .order('validated_at', { ascending: false })
      .limit(10);

    if (validError) throw validError;

    if (validations && validations.length > 0) {
      validations.forEach((v, idx) => {
        console.log(`\n${idx + 1}. Validation ID: ${v.id}`);
        console.log(`   Member ID: ${v.member_id}`);
        console.log(`   Passeport: ${v.passeport_type}`);
        console.log(`   Module: ${v.module || 'Non spécifié'}`);
        console.log(`   Date validation: ${v.date_validation}`);
        console.log(`   Validateur: ${v.validateur}`);
        console.log(`   Enregistré le: ${new Date(v.validated_at).toLocaleString('fr-FR')}`);
      });

      // 2. Vérifier si les membres ont bien leur passeport mis à jour
      console.log('\n\n✅ Vérification de la mise à jour des membres:\n');
      
      const memberIds = [...new Set(validations.map(v => v.member_id))];
      
      for (const memberId of memberIds) {
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id, first_name, last_name, passeport')
          .eq('id', memberId)
          .single();

        if (memberError) {
          console.log(`❌ Erreur pour member_id ${memberId}: ${memberError.message}`);
          continue;
        }

        const memberValidations = validations.filter(v => v.member_id === memberId);
        const expectedPasseport = memberValidations[0].passeport_type;

        console.log(`Member: ${member.first_name} ${member.last_name}`);
        console.log(`  Passeport dans members: ${member.passeport || 'NULL'}`);
        console.log(`  Passeport attendu: ${expectedPasseport}`);
        
        if (member.passeport?.toLowerCase() === expectedPasseport.toLowerCase()) {
          console.log(`  ✅ Passeport correctement mis à jour\n`);
        } else {
          console.log(`  ⚠️  ATTENTION: Passeport non mis à jour!\n`);
        }
      }

      // 3. Statistiques sur les modules
      console.log('\n📊 Statistiques des modules:\n');
      const modulesCount = {
        bloc: validations.filter(v => v.module === 'bloc').length,
        difficulte: validations.filter(v => v.module === 'difficulte').length,
        none: validations.filter(v => !v.module).length,
      };

      console.log(`🧗 Bloc: ${modulesCount.bloc} validations`);
      console.log(`🧗‍♀️ Difficulté: ${modulesCount.difficulte} validations`);
      console.log(`⚪ Sans module: ${modulesCount.none} validations (normal pour Orange)`);

    } else {
      console.log('❌ Aucune validation trouvée dans la base de données.');
    }

    // 4. Vérifier les membres avec passeport mais sans validation
    console.log('\n\n🔍 Membres avec passeport défini:\n');
    const { data: membersWithPasseport, error: membersError } = await supabase
      .from('members')
      .select('id, first_name, last_name, passeport')
      .not('passeport', 'is', null)
      .order('last_name');

    if (membersError) throw membersError;

    if (membersWithPasseport && membersWithPasseport.length > 0) {
      console.log(`Total: ${membersWithPasseport.length} membres\n`);
      
      for (const member of membersWithPasseport) {
        const { data: validation, error: valError } = await supabase
          .from('passeport_validations')
          .select('id, passeport_type, module, date_validation')
          .eq('member_id', member.id)
          .order('validated_at', { ascending: false })
          .limit(1);

        if (valError) continue;

        const hasValidation = validation && validation.length > 0;
        const icon = hasValidation ? '✅' : '⚠️';
        
        console.log(`${icon} ${member.first_name} ${member.last_name}`);
        console.log(`   Passeport: ${member.passeport}`);
        
        if (hasValidation) {
          console.log(`   Dernière validation: ${validation[0].passeport_type} (${validation[0].module || 'complet'})`);
          console.log(`   Date: ${validation[0].date_validation}`);
        } else {
          console.log(`   ⚠️  Aucune validation trouvée en base!`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkRecentValidations();
