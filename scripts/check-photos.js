import { supabase } from '../src/lib/customSupabaseClient.js';

const checkMembersWithPhotos = async () => {
  console.log('🔍 Vérification des membres avec photos...');
  
  const { data, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, photo_url, title')
    .not('photo_url', 'is', null)
    .limit(10);
  
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Membres avec photos trouvés:', data.length);
    data.forEach(member => {
      console.log(`- ${member.first_name} ${member.last_name}: ${member.photo_url}`);
    });
  }

  // Vérifier également le bucket storage
  console.log('\n📁 Vérification du bucket storage...');
  const { data: storageData, error: storageError } = await supabase.storage
    .from('member-photos')
    .list('', { limit: 10 });
  
  if (storageError) {
    console.error('❌ Erreur storage:', storageError);
  } else {
    console.log('✅ Fichiers dans le bucket:', storageData.length);
    storageData.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
    });
  }
};

checkMembersWithPhotos();