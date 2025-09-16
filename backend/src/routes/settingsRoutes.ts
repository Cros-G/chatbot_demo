import express from 'express';

const router = express.Router();

// TODO: 实现系统设置路由
router.get('/', (req, res) => {
  res.json({ data: { memory_window_size: 10, evaluation_enabled: true }, message: '系统设置路由待实现' });
});

export { router as settingsRoutes };
