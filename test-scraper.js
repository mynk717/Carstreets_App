// Fixed scraper health check with correct endpoint
const fetch = require('node-fetch');

const testScraper = async () => {
  console.log('🔍 Testing scraper health...');
  
  try {
    // FIXED: Correct endpoint path
    const response = await fetch('http://localhost:3000/api/admin/scrape', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profileUrl: 'https://www.olx.in/profile/test-user' // Use a real OLX profile for testing
      })
    });
    
    console.log('✅ Scraper API responsive:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Scrape result:', data.success ? 'SUCCESS' : 'FAILED');
    console.log('📈 Cars scraped:', data.totalCars || 0);
    
    // Test 2: Check current database state
    const carsResponse = await fetch('http://localhost:3000/api/cars');
    const carsData = await carsResponse.json();
    
    console.log('✅ Database connection:', carsData.success ? 'OK' : 'FAILED');
    console.log('📊 Total cars in DB:', carsData.cars?.length || 0);
    
    // Test 3: Check for Cloudinary images
    const cloudinaryImages = carsData.cars?.filter(car => 
      car.images?.some(img => img.includes('res.cloudinary.com'))
    ).length || 0;
    
    console.log('☁️ Cars with Cloudinary images:', cloudinaryImages);
    
    // Test 4: Check manual edits (if tracking fields exist)
    const manuallyEdited = carsData.cars?.filter(car => car.manuallyEdited).length || 0;
    console.log('✏️ Manually edited cars:', manuallyEdited);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your Next.js app is running: npm run dev');
    }
  }
};

// Install node-fetch if needed
console.log('💡 If you get module errors, run: npm install node-fetch');
testScraper();
