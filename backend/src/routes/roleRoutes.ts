import express from 'express';

const router = express.Router();

// TODO: 实现角色路由
router.get('/', (req, res) => {
  res.json({ data: [], message: '角色路由待实现' });
});

export { router as roleRoutes };
