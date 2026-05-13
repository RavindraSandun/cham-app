import http from 'http';

const testSnoopy = () => {
  const productData = JSON.stringify({
    name: "Snoopy (Automated Test)",
    price: "2500",
    description: "Classic Snoopy crochet creation with a 10% discount.",
    images: ["https://images.unsplash.com/photo-1599566150163-29194dcaad36"],
    category: "Animals",
    discountPercentage: "10"
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': productData.length
    }
  };

  console.log('--- Testing Product Creation (Port 5000) ---');
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const created = JSON.parse(data);
        console.log('Created Product:', created);
        if (created.discountPercentage === '10') {
          console.log('\n✅ SUCCESS: Discount Percentage (10%) is correctly saved and returned!');
          console.log('You can now see "Snoopy (Automated Test)" on your Market page (http://localhost:5175/market) with the -10% badge.');
        } else {
          console.log('\n❌ FAILURE: Discount Percentage was not saved correctly.');
        }

        // I will NOT delete it yet, so the user can see it in their browser
        console.log('\n--- I have left the product in the DB for your verification. ---');
      } catch (err) {
        console.error('Failed to parse response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request Error:', err.message);
    console.log('Make sure the server is running on port 5000 (npm run server).');
  });

  req.write(productData);
  req.end();
};

testSnoopy();
