const { Server } = require('socket.io');
const config = require('./index');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Base client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Base client disconnected: ${socket.id}`);
    });
  });

  // Register the Namespaces dynamically from socket dir
  try {
    const registerNamespaces = require('../socket');
    registerNamespaces(io);
    console.log('[Socket] Namespaces /chat and /notifications registered');
  } catch (error) {
    console.warn('[Socket] Namespaces module not active/found yet:', error.message);
  }

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIo };
