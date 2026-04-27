const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const { initSocket } = require('./config/socket');
require('./config/firebase'); // Init Firebase Admin
const initCrons = require('./cron');

let server;

// Connect to MongoDB
connectDB().then(() => {
  // Create HTTP Server
  server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Initialize Crons
  initCrons();

  // Listen
  server.listen(config.port, () => {
    console.log(`[Server] Listening on port ${config.port} in ${config.env} mode`);
  });
}).catch((err) => {
  console.error('[Server] Failed to connect to DB, starting server without DB for now to not block deployment', err);
    // Create HTTP Server anyway for health-checks if needed
    server = http.createServer(app);
    initSocket(server);
    server.listen(config.port, () => {
      console.log(`[Server] (NO DB) Listening on port ${config.port} in ${config.env} mode`);
    });
});

// Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception. Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection. Shutting down...');
  console.error(err.name, err.message, err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
