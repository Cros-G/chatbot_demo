import express from 'express';
import { variableController } from '../controllers/variableController';

const router = express.Router();

// GET /api/variables - 获取所有变量配置
router.get('/', variableController.getAllVariables);

// GET /api/variables/sample - 获取示例变量值
router.get('/sample', variableController.getSampleVariables);

// GET /api/variables/category/:category - 按分类获取变量
router.get('/category/:category', variableController.getVariablesByCategory);

// GET /api/variables/:id - 获取单个变量配置
router.get('/:id', variableController.getVariableById);

// PUT /api/variables/:id - 更新变量配置
router.put('/:id', variableController.updateVariable);

export { router as variableRoutes };

