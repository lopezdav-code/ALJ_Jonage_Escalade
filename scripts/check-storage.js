import { supabase } from '../src/lib/customSupabaseClient.js';

async function checkStorage() {
    console.log('🔍 Checking Supabase Storage...');

    if (!supabase.storage) {
        console.error('❌ Error: supabase.storage is undefined');
        return;
    }

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error);
    } else {
        console.log('✅ Connected to Storage. Buckets found:', buckets.map(b => b.name));

        const bucketName = 'competition_photos';
        const exists = buckets.find(b => b.name === bucketName);

        if (exists) {
            console.log(`✅ Bucket "${bucketName}" exists!`);
        } else {
            console.error(`❌ Bucket "${bucketName}" does NOT exist!`);
            console.log('💡 You should create this bucket in the Supabase dashboard with public access or appropriate RLS.');
        }
    }
}

checkStorage();
