import express from 'express';
import { conversationController } from '../controllers/conversationController';

const router = express.Router();

// GET /api/conversations - 获取所有对话
router.get('/', conversationController.getAllConversations);

// GET /api/conversations/:id - 获取单个对话详情
router.get('/:id', conversationController.getConversationById);

// POST /api/conversations - 创建对话
router.post('/', conversationController.createConversation);

// PUT /api/conversations/:id - 更新对话（重命名等）
router.put('/:id', conversationController.updateConversation);

// DELETE /api/conversations/:id - 删除对话
router.delete('/:id', conversationController.deleteConversation);

// POST /api/conversations/:id/messages - 发送消息
router.post('/:id/messages', conversationController.sendMessage);

// POST /api/conversations/:id/chat - 发送消息并获取AI回复
router.post('/:id/chat', conversationController.sendMessageWithAI);

export { router as conversationRoutes };
