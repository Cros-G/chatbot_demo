import express from 'express';

const router = express.Router();

// TODO: 实现提示词路由
router.get('/', (req, res) => {
  res.json({ data: [], message: '提示词路由待实现' });
});

export { router as promptRoutes };
