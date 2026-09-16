import { createApp } from './app.js';
import { env } from './config/env.js';
import { SocketService } from './services/socketService.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';

async function startServer() {
  // Connect to MongoDB if MONGODB_URI is provided
  if (env.MONGODB_URI) {
    await connectMongo();
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 DMetrics Backend Server running on http://localhost:${env.PORT}`);
    console.log(`📚 Interactive Swagger API Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`💓 Health Diagnostic: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  // Initialize WebSockets
  SocketService.init(server);

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\nGracefully shutting down server...');
    await disconnectMongo();
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
