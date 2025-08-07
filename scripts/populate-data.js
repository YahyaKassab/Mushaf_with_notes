#!/usr/bin/env node

/**
 * Data Population CLI Script
 * Usage: node scripts/populate-data.js [options]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dataPopulation = require('../services/dataPopulation');
const connectDB = require('../config/database');

// CLI argument parsing
const args = process.argv.slice(2);
const options = {
  startPage: 1,
  endPage: 604,
  forceUpdate: false,
  downloadImages: true,
  imageQuality: 'high',
  batchSize: 10,
  showHelp: false
};

// Parse command line arguments
args.forEach((arg, index) => {
  switch (arg) {
    case '--start':
    case '-s':
      options.startPage = parseInt(args[index + 1]) || 1;
      break;
    case '--end':
    case '-e':
      options.endPage = parseInt(args[index + 1]) || 604;
      break;
    case '--force':
    case '-f':
      options.forceUpdate = true;
      break;
    case '--no-images':
      options.downloadImages = false;
      break;
    case '--quality':
    case '-q':
      options.imageQuality = args[index + 1] || 'high';
      break;
    case '--batch':
    case '-b':
      options.batchSize = parseInt(args[index + 1]) || 10;
      break;
    case '--help':
    case '-h':
      options.showHelp = true;
      break;
  }
});

// Help text
function showHelp() {
  console.log(`
📚 Mushaf Data Population Script

Usage: node scripts/populate-data.js [options]

Options:
  -s, --start <page>     Start from page number (default: 1)
  -e, --end <page>       End at page number (default: 604)
  -f, --force            Force update existing pages
  --no-images            Skip image downloads
  -q, --quality <level>  Image quality: high|medium|low (default: high)
  -b, --batch <size>     Batch size for processing (default: 10)
  -h, --help             Show this help message

Examples:
  node scripts/populate-data.js                    # Populate all pages
  node scripts/populate-data.js -s 1 -e 10        # Populate pages 1-10
  node scripts/populate-data.js -f -q medium      # Force update with medium quality
  node scripts/populate-data.js --no-images       # Populate without downloading images

Environment Variables:
  MONGODB_URI           MongoDB connection string
  NODE_ENV             Environment (development/production)
  BASE_URL             Base URL for image serving
`);
}

// Validation
function validateOptions() {
  if (options.startPage < 1 || options.startPage > 604) {
    console.error('❌ Start page must be between 1 and 604');
    return false;
  }
  
  if (options.endPage < 1 || options.endPage > 604) {
    console.error('❌ End page must be between 1 and 604');
    return false;
  }
  
  if (options.startPage > options.endPage) {
    console.error('❌ Start page must be less than or equal to end page');
    return false;
  }
  
  if (!['high', 'medium', 'low'].includes(options.imageQuality)) {
    console.error('❌ Image quality must be: high, medium, or low');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  try {
    if (options.showHelp) {
      showHelp();
      return;
    }

    if (!validateOptions()) {
      process.exit(1);
    }

    console.log('🚀 Starting Mushaf Data Population');
    console.log('=====================================');
    console.log(`📄 Pages: ${options.startPage} - ${options.endPage} (${options.endPage - options.startPage + 1} pages)`);
    console.log(`🖼️ Images: ${options.downloadImages ? 'Yes' : 'No'}`);
    console.log(`📊 Quality: ${options.imageQuality}`);
    console.log(`🔄 Force Update: ${options.forceUpdate ? 'Yes' : 'No'}`);
    console.log(`📦 Batch Size: ${options.batchSize}`);
    console.log('=====================================\n');

    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Check current status
    console.log('📊 Checking current status...');
    const status = await dataPopulation.getPopulationStatus();
    console.log(`📄 Current pages in database: ${status.totalPages}/${status.expectedPages}`);
    console.log(`🖼️ Pages with images: ${status.pagesWithImages}`);
    console.log(`📍 Pages with coordinates: ${status.pagesWithCoordinates}`);
    console.log(`💾 Storage: ${status.storageStats.totalSizeMB}MB (${status.storageStats.imageCount} images)\n`);

    // Ask for confirmation for large operations
    const pageCount = options.endPage - options.startPage + 1;
    if (pageCount > 50 && !options.forceUpdate) {
      console.log('⚠️ You are about to populate a large number of pages.');
      console.log('💡 Tip: Use --force flag to skip this confirmation in the future.');
      
      // Simple confirmation (in a real CLI, you might use a library like 'inquirer')
      console.log('📝 Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Start population
    const results = await dataPopulation.populateAllPages({
      startPage: options.startPage,
      endPage: options.endPage,
      forceUpdate: options.forceUpdate,
      downloadImages: options.downloadImages,
      imageQuality: options.imageQuality
    });

    // Show final results
    console.log('\n🎉 Population Complete!');
    console.log('========================');
    console.log(`✅ Successful: ${results.success} pages`);
    console.log(`❌ Failed: ${results.failed} pages`);
    console.log(`⏭️ Skipped: ${results.skipped} pages`);
    console.log(`⏱️ Duration: ${Math.round(results.duration / 1000)}s`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`  Page ${error.page}: ${error.error}`);
      });
    }

    // Show updated status
    console.log('\n📊 Final Status:');
    const finalStatus = await dataPopulation.getPopulationStatus();
    console.log(`📄 Total pages: ${finalStatus.totalPages}/${finalStatus.expectedPages} (${finalStatus.completionPercentage}%)`);
    console.log(`💾 Storage: ${finalStatus.storageStats.totalSizeMB}MB`);

  } catch (error) {
    console.error('\n💥 Population failed:', error.message);
    console.error(error.stack);
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
  console.log('\n⏹️ Shutting down gracefully...');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
