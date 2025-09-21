import express from 'express';
import { templateController } from '../controllers/templateController';

const router = express.Router();

// GET /api/templates - 获取所有模板
router.get('/', templateController.getAllTemplates);

// GET /api/templates/:id - 获取单个模板
router.get('/:id', templateController.getTemplateById);

// POST /api/templates - 创建模板
router.post('/', templateController.createTemplate);

// PUT /api/templates/:id - 更新模板
router.put('/:id', templateController.updateTemplate);

// DELETE /api/templates/:id - 删除模板
router.delete('/:id', templateController.deleteTemplate);

export { router as templateRoutes };
