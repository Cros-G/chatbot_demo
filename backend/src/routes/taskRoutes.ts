import express from 'express';
import { taskController } from '../controllers/taskController';

const router = express.Router();

// GET /api/tasks - 获取所有任务
router.get('/', taskController.getAllTasks);

// GET /api/tasks/:id - 获取单个任务
router.get('/:id', taskController.getTaskById);

// POST /api/tasks - 创建任务
router.post('/', taskController.createTask);

// PUT /api/tasks/:id - 更新任务
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id - 删除任务
router.delete('/:id', taskController.deleteTask);

export { router as taskRoutes };
