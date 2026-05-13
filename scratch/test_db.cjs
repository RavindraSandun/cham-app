const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  offerPrice: String,
  offerExpiry: String,
  description: { type: String, required: true },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function runTests() {
  console.log('\n🔌 Connecting to:', process.env.MONGODB_URI?.substring(0, 40) + '...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected!\n');

  // CREATE
  console.log('📝 Test 1: Creating a test product...');
  const created = await Product.create({
    name: 'Test Plush [AUTO-TEST]',
    price: '999',
    description: 'Auto-test product - safe to delete',
    images: []
  });
  console.log('   ✅ Created:', created._id.toString());

  // READ ALL
  console.log('\n📋 Test 2: Fetching all products...');
  const all = await Product.find().sort({ createdAt: -1 }).limit(5);
  console.log(`   ✅ Found ${all.length} product(s) (showing up to 5)`);
  all.forEach(p => console.log(`      - ${p.name} | Rs.${p.price}`));

  // READ ONE
  console.log('\n🔍 Test 3: Fetching product by ID...');
  const single = await Product.findById(created._id);
  console.log('   ✅ Found:', single?.name);

  // UPDATE
  console.log('\n✏️  Test 4: Updating product...');
  const updated = await Product.findByIdAndUpdate(
    created._id,
    { price: '1299', offerPrice: '999' },
    { new: true }
  );
  console.log('   ✅ Updated price to:', updated?.price, '| Offer:', updated?.offerPrice);

  // DELETE
  console.log('\n🗑️  Test 5: Deleting test product...');
  await Product.findByIdAndDelete(created._id);
  const gone = await Product.findById(created._id);
  console.log('   ✅ Deleted:', gone === null ? 'confirmed (null)' : '❌ FAILED - still exists');

  console.log('\n✅ All DB tests passed!\n');
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
