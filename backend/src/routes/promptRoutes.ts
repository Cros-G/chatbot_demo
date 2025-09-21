import { Router, Request, Response, NextFunction } from 'express';
import { promptService } from '../services/promptService';
import { errorHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/prompts - 获取所有提示词
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompts = await promptService.getAllPrompts();
    res.json({ data: prompts, message: '获取提示词成功' });
  } catch (error) {
    next(error);
  }
});

// GET /api/prompts/category/:category - 按分类获取提示词 (必须在/:id之前)
router.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const prompts = await promptService.getAllPrompts().then(all => 
      all.filter(p => p.category === category)
    );
    res.json({ data: prompts, message: '获取分类提示词成功' });
  } catch (error) {
    next(error);
  }
});

// GET /api/prompts/:id - 获取单个提示词
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    const prompt = await promptService.getPromptById(id);
    res.json({ data: prompt, message: '获取提示词成功' });
  } catch (error) {
    next(error);
  }
});

// POST /api/prompts - 创建新提示词
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.createPrompt(req.body);
    res.status(201).json({ data: prompt, message: '创建提示词成功' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/prompts/:id - 更新提示词
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    const prompt = await promptService.updatePrompt(id, req.body);
    res.json({ data: prompt, message: '更新提示词成功' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/prompts/:id - 删除提示词
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    await promptService.deletePrompt(id);
    res.json({ message: '删除提示词成功' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/prompts/:id/activate - 激活提示词
router.put('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    const prompt = await promptService.activatePrompt(id);
    res.json({ data: prompt, message: '激活提示词成功' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/prompts/:id/deactivate - 停用提示词 (临时使用简单实现)
router.put('/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    // 临时实现：直接更新数据库
    const { db } = require('../models/database');
    await db.run('UPDATE prompts SET is_active = 0 WHERE id = ?', [id]);
    const prompt = await promptService.getPromptById(id);
    res.json({ data: prompt, message: '停用提示词成功' });
  } catch (error) {
    next(error);
  }
});

// POST /api/prompts/preview - 预览提示词（带变量替换）
router.post('/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { template, variables } = req.body;
    // 简单的变量替换实现
    let preview = template;
    if (variables) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        preview = preview.replace(regex, variables[key] || '');
      });
    }
    res.json({ data: { preview }, message: '预览生成成功' });
  } catch (error) {
    next(error);
  }
});

// GET /api/prompts/:id/versions - 获取提示词版本历史 (简化实现)
router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: '缺少提示词ID' });
    }
    // 简化实现：返回当前版本
    const prompt = await promptService.getPromptById(id);
    res.json({ data: [prompt], message: '获取版本历史成功' });
  } catch (error) {
    next(error);
  }
});

export { router as promptRoutes };
