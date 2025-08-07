#!/usr/bin/env node

/**
 * Quick Setup Script for Mushaf with Notes
 * This script sets up the environment and populates sample data
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const dataPopulation = require('../services/dataPopulation');
const quranApi = require('../services/quranApi');

console.log(`
🕌 Mushaf with Notes - Quick Setup
==================================

This script will:
1. Check environment configuration
2. Test API connectivity
3. Set up directories
4. Populate sample data (first 5 pages)
5. Verify installation

`);

async function main() {
  try {
    // Step 1: Check environment
    console.log('📋 Step 1: Checking environment configuration...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('💡 Please copy .env.example to .env and configure it');
      return;
    }
    
    console.log('✅ Environment configuration found');

    // Step 2: Test API connectivity
    console.log('\n🌐 Step 2: Testing API connectivity...');
    const apiConnected = await quranApi.testConnection();
    
    if (!apiConnected) {
      console.error('❌ Cannot connect to Quran API');
      console.log('💡 Please check your internet connection');
      return;
    }

    // Step 3: Connect to database
    console.log('\n🔌 Step 3: Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    // Step 4: Set up directories
    console.log('\n📁 Step 4: Setting up directories...');
    const dirs = [
      'public',
      'public/images',
      'public/images/pages',
      'public/images/thumbnails'
    ];

    for (const dir of dirs) {
      const dirPath = path.join(__dirname, '..', dir);
      await fs.ensureDir(dirPath);
      console.log(`  ✅ Created: ${dir}`);
    }

    // Step 5: Check current status
    console.log('\n📊 Step 5: Checking current data status...');
    const status = await dataPopulation.getPopulationStatus();
    console.log(`  📄 Pages in database: ${status.totalPages}/604`);
    console.log(`  🖼️ Images downloaded: ${status.storageStats.imageCount}`);
    console.log(`  💾 Storage used: ${status.storageStats.totalSizeMB}MB`);

    // Step 6: Populate sample data if empty
    console.log('\n🚀 Step 6: Populating sample data...');
    
    if (status.totalPages < 5) {
      console.log('  📥 Populating first 5 pages as sample data...');
      
      const results = await dataPopulation.populateAllPages({
        startPage: 1,
        endPage: 5,
        forceUpdate: false,
        downloadImages: true,
        imageQuality: 'high'
      });

      console.log(`  ✅ Sample data populated: ${results.success} pages successful`);
      
      if (results.failed > 0) {
        console.log(`  ⚠️ ${results.failed} pages failed - this is normal for initial setup`);
      }
    } else {
      console.log('  ✅ Sample data already exists');
    }

    // Step 7: Verify installation
    console.log('\n🔍 Step 7: Verifying installation...');
    
    const finalStatus = await dataPopulation.getPopulationStatus();
    const isReady = finalStatus.totalPages >= 1;
    
    if (isReady) {
      console.log('✅ Installation verification successful!');
      
      console.log(`
🎉 Setup Complete!
==================

Your Mushaf with Notes backend is ready!

📊 Current Status:
  • Database: Connected ✅
  • API: Connected ✅
  • Sample Data: ${finalStatus.totalPages} pages ✅
  • Images: ${finalStatus.storageStats.imageCount} downloaded ✅

🚀 Next Steps:
  1. Start the server: npm run dev
  2. Test the API: http://localhost:3000/health
  3. Admin panel: http://localhost:3000/api/admin/status
  4. Populate more data: npm run populate

📝 API Endpoints:
  • GET /api/pages/:pageNumber - Get page data
  • GET /api/pages/:pageNumber/verses - Get verses text
  • GET /api/admin/status - Check population status
  • POST /api/admin/populate - Populate more pages

🔧 Populate All Data:
  To populate all 604 pages, run:
  npm run populate

  This will take approximately 20-30 minutes and download ~500MB of images.

📚 Frontend Development:
  Your backend is now ready for frontend development!
  All endpoints are available for building your React/Vue/Angular frontend.
`);
    } else {
      console.log('❌ Installation verification failed');
      console.log('💡 Try running the setup again or check error messages above');
    }

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    console.error('\n🔍 Debug info:', error.stack);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check your .env file configuration');
    console.log('  2. Ensure MongoDB is running');
    console.log('  3. Check your internet connection');
    console.log('  4. Try running individual components:');
    console.log('     - node -e "require(\'./services/quranApi\').testConnection()"');
    console.log('     - mongosh $MONGODB_URI');
  } finally {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\n🔌 Database disconnected');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Setup interrupted by user');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the setup
main().catch(error => {
  console.error('💥 Setup script failed:', error);
  process.exit(1);
});
