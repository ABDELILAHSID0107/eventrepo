module.exports = (io, socket) => {
  // Join a specific chat thread to actively stream updates
  socket.on('join_thread', ({ threadId }) => {
    socket.join(threadId);
  });

  // Leave thread
  socket.on('leave_thread', ({ threadId }) => {
    socket.leave(threadId);
  });

  // Typing indicator broadcasted to specific Thread channels
  socket.on('typing', ({ threadId }) => {
    socket.to(threadId).emit('typing', { threadId, userId: socket.user.id });
  });

  // Stop typing indicator 
  socket.on('stop_typing', ({ threadId }) => {
    socket.to(threadId).emit('stop_typing', { threadId, userId: socket.user.id });
  });
};
