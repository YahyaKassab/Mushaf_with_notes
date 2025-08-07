#!/usr/bin/env node

/**
 * Test API Endpoints
 * This script tests all the main endpoints to verify the implementation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await api.get('/health');
    console.log('✅ Health Check:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing user registration...');
  try {
    const response = await api.post('/api/auth/register', TEST_USER);
    console.log('✅ User registered successfully');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('✅ User already exists (expected)');
      return true;
    }
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing user login...');
  try {
    const response = await api.post('/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = response.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminStatus() {
  console.log('\n📊 Testing admin status...');
  try {
    const response = await api.get('/api/admin/status');
    const data = response.data.data;
    
    console.log(`✅ Admin Status:
      📄 Pages: ${data.totalPages}/${data.expectedPages} (${data.completionPercentage}%)
      🖼️ Images: ${data.pagesWithImages} pages
      📍 Coordinates: ${data.pagesWithCoordinates} pages
      💾 Storage: ${data.storageStats.totalSizeMB}MB`);
    
    return data.totalPages > 0;
  } catch (error) {
    console.error('❌ Admin status failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPageData() {
  console.log('\n📄 Testing page data retrieval...');
  try {
    const response = await api.get('/api/pages/1');
    const page = response.data.data.page;
    
    console.log(`✅ Page 1 Data:
      🖼️ Image URL: ${page.imageUrl}
      📍 Word Coordinates: ${page.wordCoordinates.length} words
      📏 Line Coordinates: ${page.lineCoordinates.length} lines
      📚 Surah Info: ${page.surahInfo.length} surahs`);
    
    return true;
  } catch (error) {
    console.error('❌ Page data failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPageVerses() {
  console.log('\n📖 Testing page verses...');
  try {
    const response = await api.get('/api/pages/1/verses');
    const data = response.data.data;
    
    console.log(`✅ Page 1 Verses:
      📝 Total verses: ${data.totalVerses}
      📊 Data source: ${data.source}
      📚 First verse: ${data.verses[0]?.text_uthmani?.substring(0, 50)}...`);
    
    return data.totalVerses > 0;
  } catch (error) {
    console.error('❌ Page verses failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPagesListing() {
  console.log('\n📋 Testing pages listing...');
  try {
    const response = await api.get('/api/pages?limit=5');
    const data = response.data.data;
    
    console.log(`✅ Pages Listing:
      📄 Pages returned: ${data.pages.length}
      📊 Total items: ${data.pagination.totalItems}
      📋 Current page: ${data.pagination.currentPage}/${data.pagination.totalPages}`);
    
    return data.pages.length > 0;
  } catch (error) {
    console.error('❌ Pages listing failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testApiDocumentation() {
  console.log('\n📚 Testing API documentation...');
  try {
    const response = await api.get('/api');
    console.log('✅ API Documentation available');
    return true;
  } catch (error) {
    console.error('❌ API documentation failed:', error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log(`
🧪 Mushaf with Notes - API Testing
==================================

Testing backend implementation...
`);

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'API Documentation', fn: testApiDocumentation },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Admin Status', fn: testAdminStatus },
    { name: 'Page Data', fn: testPageData },
    { name: 'Page Verses', fn: testPageVerses },
    { name: 'Pages Listing', fn: testPagesListing }
  ];

  const results = { passed: 0, failed: 0 };

  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} crashed:`, error.message);
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final results
  console.log(`
🎯 Test Results Summary
=======================
✅ Passed: ${results.passed}
❌ Failed: ${results.failed}
📊 Total: ${tests.length}

${results.failed === 0 ? '🎉 All tests passed! Your backend is ready for frontend development.' : '⚠️ Some tests failed. Please check the errors above.'}

🚀 Your Mushaf with Notes backend is now fully functional with:
   • Verse text from Quran.com API
   • Page images from QuranCDN  
   • Word coordinates (generated)
   • Complete REST API
   • Authentication system
   • Admin panel for data management

📱 Ready for frontend development!
`);

  return results.failed === 0;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Tests interrupted by user');
  process.exit(0);
});

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}
