import express from 'express';

const router = express.Router();

// TODO: 实现对话路由
router.get('/', (req, res) => {
  res.json({ data: [], message: '对话路由待实现' });
});

export { router as conversationRoutes };
