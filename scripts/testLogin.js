require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login...');
    
    const response = await axios.post('https://civicsnap.onrender.com', {
      email: 'admin@civicmapper.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLogin();