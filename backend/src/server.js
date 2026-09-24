const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const bootstrapAdmin = require('./utils/bootstrapAdmin');

const startServer = async () => {
  await connectDB();
  await bootstrapAdmin();

  const HOST = '0.0.0.0';
  const server = app.listen(env.PORT, HOST, () => {
    console.log(`[Server] Running in ${env.NODE_ENV} mode on http://${HOST}:${env.PORT}`);
    if (process.env.PUBLIC_API_URL) {
      console.log(`[Server] Public API: ${process.env.PUBLIC_API_URL}/api`);
    } else {
      console.log(`[Server] Local API: http://localhost:${env.PORT}/api`);
      console.log(`[Server] Android Emulator API: http://10.0.2.2:${env.PORT}/api`);
    }
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
