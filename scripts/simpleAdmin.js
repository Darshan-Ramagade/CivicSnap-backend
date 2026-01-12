require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected');
    
    // Hash password manually
    const hash = await bcrypt.hash('admin123', 10);
    
    // Delete old
    await mongoose.connection.collection('users').deleteMany({ email: 'admin@civicmapper.com' });
    
    // Insert new
    await mongoose.connection.collection('users').insertOne({
      name: 'Admin',
      email: 'admin@civicmapper.com',
      password: hash,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Admin created!');
    console.log('Email: admin@civicmapper.com');
    console.log('Password: admin123');
    
    // Test password
    const user = await mongoose.connection.collection('users').findOne({ email: 'admin@civicmapper.com' });
    const match = await bcrypt.compare('admin123', user.password);
    console.log('Password test:', match ? '✅ WORKS' : '❌ FAILED');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });