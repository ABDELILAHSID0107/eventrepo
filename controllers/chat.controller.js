const ChatThread = require('../models/ChatThread');
const Message = require('../models/Message');
const uploadService = require('../services/upload.service');
const { getIo } = require('../config/socket');
const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

const createThread = asyncHandler(async (req, res) => {
  const { recipientId, listingId } = req.body;
  
  if (recipientId === req.user.id.toString()) {
     throw new ApiError(400, 'Cannot open chat thread with yourself');
  }

  // Find if a thread already exists
  let thread = await ChatThread.findOne({
    participants: { $all: [req.user.id, recipientId] },
    listing: listingId || { $exists: false } // optional specific contextual thread per listing
  });

  if (!thread) {
    const unreadCount = new Map();
    unreadCount.set(req.user.id.toString(), 0);
    unreadCount.set(recipientId.toString(), 0);

    thread = await ChatThread.create({
      participants: [req.user.id, recipientId],
      listing: listingId,
      unreadCount
    });
  }

  res.status(201).json({ status: 'success', data: { thread } });
});

const getThreads = asyncHandler(async (req, res) => {
  const query = { participants: req.user.id };
  const options = {
     page: req.query.page || 1,
     limit: req.query.limit || 50,
     sortBy: 'lastMessageAt:desc',
     populate: [
       { path: 'participants', select: 'firstName lastName avatarUrl' },
       { path: 'listing', select: 'title coverImageUrl' }
     ]
  };

  const result = await paginate(ChatThread, query, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const getMessages = asyncHandler(async (req, res) => {
  const threadId = req.params.id;
  
  // Verify access
  const thread = await ChatThread.findById(threadId);
  if (!thread || !thread.participants.includes(req.user.id)) {
      throw new ApiError(403, 'Not authorized to view messages in this thread');
  }
  
  const query = { thread: threadId };
  if (req.query.before) {
      query._id = { $lt: req.query.before };
  }
  
  const options = {
    page: 1, // continuous infinite scrolling logic handled mostly by 'before' query
    limit: req.query.limit || 50,
    sortBy: 'createdAt:desc',
    populate: { path: 'sender', select: 'firstName lastName avatarUrl' }
  };
  
  const result = await paginate(Message, query, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const sendMessage = asyncHandler(async (req, res) => {
  const threadId = req.params.id;
  const { content } = req.body;
  let type = req.body.type || 'text';
  let imageUrl = null;
  
  const thread = await ChatThread.findById(threadId);
  if (!thread || !thread.participants.includes(req.user.id)) {
      throw new ApiError(403, 'Not authorized to send messages to this thread');
  }

  // Handle Image Upload
  if (req.file) {
      imageUrl = await uploadService.uploadImageBuffer(req.file.buffer, 'fetesalle-dz/chat');
      type = 'image';
  }

  if (!content && !imageUrl) {
      throw new ApiError(400, 'Message content or image is required');
  }

  const message = await Message.create({
    thread: threadId,
    sender: req.user.id,
    content: content || 'Image uploaded',
    type,
    imageUrl,
    readBy: [req.user.id]
  });

  // Update thread stats
  thread.lastMessage = type === 'image' ? 'Image message' : content.substring(0, 50);
  thread.lastMessageAt = new Date();
  
  const recipientId = thread.participants.find(p => p.toString() !== req.user.id.toString());
  
  // Increment unread count safely
  const currentCount = thread.unreadCount.get(recipientId.toString()) || 0;
  thread.unreadCount.set(recipientId.toString(), currentCount + 1);
  
  await thread.save();

  // Populate message for broadcast
  await message.populate('sender', 'firstName lastName avatarUrl');

  // Broadcast to realtime socket namespaces
  try {
     const io = getIo();
     io.of('/chat').to(threadId.toString()).emit('new_message', message);
     
     // Trigger push notification to recipient
     // Note: FCM Push shouldn't run blockingly
     notificationService.notifyUser(recipientId, {
         eventType: 'new_chat_message',
         title: 'New Message',
         body: message.sender.firstName + ': ' + thread.lastMessage,
         data: { message },
         pushData: { threadId: threadId.toString(), event: 'new_message' }
     });
  } catch (err) {
     console.error('Socket or Push Notification delivery failure for chat:', err);
  }

  res.status(201).json({ status: 'success', data: { message } });
});

const markRead = asyncHandler(async (req, res) => {
  const threadId = req.params.id;
  const thread = await ChatThread.findById(threadId);
  
  if (!thread || !thread.participants.includes(req.user.id)) {
      throw new ApiError(403, 'Not authorized');
  }

  // Update readBy on unread messages
  await Message.updateMany(
    { thread: threadId, readBy: { $ne: req.user.id } },
    { $push: { readBy: req.user.id } }
  );

  thread.unreadCount.set(req.user.id.toString(), 0);
  await thread.save();

  try {
    const io = getIo();
    io.of('/chat').to(threadId.toString()).emit('messages_read', { 
       threadId, 
       userId: req.user.id 
    });
  } catch(e) {
      console.warn('Socket error on emit messages_read', e.message);
  }

  res.status(200).json({ status: 'success', data: { thread } });
});

module.exports = {
  createThread,
  getThreads,
  getMessages,
  sendMessage,
  markRead
};
