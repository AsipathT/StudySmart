const app = require('./app');
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const { connectMongoDB } = require('../config/database');
    await connectMongoDB();
  } catch (e) {
    console.warn('⚠️ MongoDB unavailable:', e.message);
  }

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Login:  POST http://localhost:${PORT}/api/auth/login`);
  });
};

startServer();
