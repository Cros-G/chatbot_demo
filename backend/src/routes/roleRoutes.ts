import express from 'express';
import { roleController } from '../controllers/roleController';

const router = express.Router();

// GET /api/roles - 获取所有角色
router.get('/', roleController.getAllRoles);

// GET /api/roles/:id - 获取单个角色
router.get('/:id', roleController.getRoleById);

// POST /api/roles - 创建角色
router.post('/', roleController.createRole);

// PUT /api/roles/:id - 更新角色
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id - 删除角色
router.delete('/:id', roleController.deleteRole);

export { router as roleRoutes };
