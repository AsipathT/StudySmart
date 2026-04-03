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

  const server = app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Login:  POST http://localhost:${PORT}/api/auth/login`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
