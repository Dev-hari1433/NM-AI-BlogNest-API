const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

/**
 * Initialize and start the AI BlogNest API Server
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express Server
    const PORT = env.PORT;
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] AI BlogNest API server running on port ${PORT}`);
      console.log(`[SERVER] Health check available at http://localhost:${PORT}/api/health`);
    });

    // Clean exit handlers
    process.on('unhandledRejection', (err) => {
      console.error(`[UNHANDLED REJECTION] ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[FATAL] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
