import http from 'http';

const checkColumns = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const products = JSON.parse(data);
        if (products.length > 0) {
            const keys = Object.keys(products[0]);
            console.log('Keys:', keys.map(k => `[${k}] (${k.length})`).join(', '));
            console.log('Raw first product:', JSON.stringify(products[0], null, 2));
        } else {
            console.log('No products found.');
        }
      } catch (err) {
        console.error('Failed to parse response');
      }
    });
  });

  req.end();
};

checkColumns();
