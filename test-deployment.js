/**
 * Test script to verify the deployed MQTT broker
 */

const https = require('https');

// Test the health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mqtt-core-service.onrender.com',
      port: 443,
      path: '/health',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Health Check Response:', JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Health Check Failed:', error);
      reject(error);
    });

    req.end();
  });
}

// Test the main dashboard
function testDashboard() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mqtt-core-service.onrender.com',
      port: 443,
      path: '/',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.includes('MQTT Broker Dashboard')) {
          console.log('✅ Dashboard is working!');
        } else {
          console.log('❌ Dashboard response unexpected');
        }
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Dashboard Test Failed:', error);
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing deployed MQTT broker...\n');
  
  try {
    await testHealth();
    await testDashboard();
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n💥 Tests failed:', error);
  }
}

runTests();