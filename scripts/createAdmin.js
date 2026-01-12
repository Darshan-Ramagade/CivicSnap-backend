require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin if exists
    const existingAdmin = await User.findOne({ email: 'admin@civicmapper.com' });
    if (existingAdmin) {
      await User.deleteOne({ email: 'admin@civicmapper.com' });
      console.log('🗑️  Deleted existing admin user');
    }

    // Create fresh admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@civicmapper.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@civicmapper.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Admin ID:', admin._id);
    console.log('✅ Role:', admin.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

createAdmin();