import express from 'express';

const router = express.Router();

// TODO: 实现模板路由
router.get('/', (req, res) => {
  res.json({ data: [], message: '模板路由待实现' });
});

export { router as templateRoutes };
