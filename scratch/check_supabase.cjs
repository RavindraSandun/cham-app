const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- Testing Supabase Insert ---');
  const sampleProduct = {
    name: "Supabase Test Product",
    price: "999",
    description: "Testing direct insert with service role key",
    images: ["https://example.com/image.png"]
  };

  const { data, error } = await supabase
    .from('products')
    .insert([sampleProduct])
    .select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('✅ Insert successful:', data);
  }
}

testInsert();
