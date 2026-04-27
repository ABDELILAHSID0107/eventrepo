const jwt = require('jsonwebtoken');
const config = require('../config');
const chatHandler = require('./chatHandler');
const notificationHandler = require('./notificationHandler');

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.user = decoded; // { id, role }
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const registerNamespaces = (io) => {
  // Chat Namespace
  const chatNsp = io.of('/chat');
  chatNsp.use(socketAuthMiddleware);
  chatNsp.on('connection', (socket) => {
    // Join a personal room to receive personal thread updates or new messages easily
    socket.join(socket.user.id);
    console.log(`[Socket] User ${socket.user.id} connected to /chat`);
    
    chatHandler(chatNsp, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user.id} left /chat`);
    });
  });

  // Notifications Namespace
  const notifNsp = io.of('/notifications');
  notifNsp.use(socketAuthMiddleware);
  notifNsp.on('connection', (socket) => {
    socket.join(socket.user.id);
    console.log(`[Socket] User ${socket.user.id} connected to /notifications`);

    notificationHandler(notifNsp, socket);
    
    socket.on('disconnect', () => {
       console.log(`[Socket] User ${socket.user.id} left /notifications`);
    });
  });
};

module.exports = registerNamespaces;
