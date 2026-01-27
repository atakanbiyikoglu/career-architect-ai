require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("HATA: .env dosyasında SUPABASE_URL veya SUPABASE_KEY eksik!");
    process.exit(1); // Kritik hata, uygulamayı durdur.
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase bağlantı istemcisi hazır.");

module.exports = supabase;