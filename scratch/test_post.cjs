const sampleProduct = {
  name: "Test Product",
  price: "100",
  description: "This is a test product to verify MongoDB write connection.",
  images: ["https://via.placeholder.com/150"]
};

async function testPost() {
  try {
    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleProduct)
    });
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Product posted successfully:', data);
    } else {
      console.error('❌ Failed to post product:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPost();
