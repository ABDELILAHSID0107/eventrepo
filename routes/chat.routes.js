const express = require('express');
const chatController = require('../controllers/chat.controller');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.use(auth); // Strongly authenticate all socket channels natively via gateway

router.post('/threads', chatController.createThread);
router.get('/threads', chatController.getThreads);

router.get('/threads/:id/messages', chatController.getMessages);
router.post('/threads/:id/messages', upload.single('image'), chatController.sendMessage);
router.patch('/threads/:id/read', chatController.markRead);

module.exports = router;
