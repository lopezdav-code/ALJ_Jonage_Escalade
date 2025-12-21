import { supabase } from '../src/lib/customSupabaseClient.js';
import fs from 'fs';

async function testUpload() {
    console.log('🧪 Testing upload to "competition_photos"...');

    const bucketName = 'competition_photos';
    const fileName = `test_${Date.now()}.txt`;
    const fileContent = 'Hello World from test script';

    try {
        console.log(`Starting upload of ${fileName}...`);
        // Using a simple Blob-like object for Node
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileContent, {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload error:', error);
            if (error.message === 'Bucket not found') {
                console.log('💡 Confirmation: The bucket really does not exist.');
            }
        } else {
            console.log('✅ Upload successful!', data);

            console.log('Cleaning up...');
            const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove([fileName]);

            if (deleteError) console.error('Error during cleanup:', deleteError);
            else console.log('✅ Cleanup successful.');
        }
    } catch (err) {
        console.error('💥 Unexpected error:', err);
    }
}

testUpload();
