#!/usr/bin/env node

/**
 * Create Test User Script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const connectDB = require('../config/database');

async function createTestUser() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();

    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('🗑️ Removing existing test user...');
      await User.deleteOne({ email: 'test@example.com' });
    }

    // Create new test user
    console.log('👤 Creating test user...');
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    
    // Verify user
    const user = await User.findOne({ email: 'test@example.com' }).select('username email profile createdAt');
    console.log('👤 User details:', {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.profile.firstName,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

createTestUser();
