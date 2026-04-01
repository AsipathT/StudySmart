const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if the specific admin email exists
    const adminExists = await User.findOne({ email: 'admin@studysmart.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@studysmart.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('✅ Admin user seeded (admin@studysmart.com / password123)');
    } else {
      console.log('ℹ️ Admin account admin@studysmart.com found. Resetting password...');
      adminExists.password = 'password123';
      await adminExists.save();
      console.log('✅ Admin password reset to: password123');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;
