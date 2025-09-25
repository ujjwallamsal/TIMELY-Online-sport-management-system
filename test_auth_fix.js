// Simple test script to verify authentication fix
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login/`, {
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    console.log('✓ Login successful');
    console.log('Response status:', loginResponse.status);
    console.log('Response data keys:', Object.keys(loginResponse.data));
    
    const { access, refresh } = loginResponse.data;
    
    // Test authenticated request
    console.log('\n2. Testing authenticated request...');
    const meResponse = await axios.get(`${BASE_URL}/api/users/me/`, {
      headers: {
        'Authorization': `Bearer ${access}`
      }
    });
    
    console.log('✓ Authenticated request successful');
    console.log('User data:', meResponse.data);
    
    // Test token refresh
    console.log('\n3. Testing token refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
      refresh: refresh
    });
    
    console.log('✓ Token refresh successful');
    console.log('New access token received:', !!refreshResponse.data.access);
    console.log('New refresh token received:', !!refreshResponse.data.refresh);
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuthFlow();
