"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptRoutes = void 0;
const express_1 = require("express");
const promptService_1 = require("../services/promptService");
const router = (0, express_1.Router)();
exports.promptRoutes = router;
router.get('/', async (req, res, next) => {
    try {
        const prompts = await promptService_1.promptService.getAllPrompts();
        res.json({ data: prompts, message: '获取提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/category/:category', async (req, res, next) => {
    try {
        const { category } = req.params;
        const prompts = await promptService_1.promptService.getAllPrompts().then(all => all.filter(p => p.category === category));
        res.json({ data: prompts, message: '获取分类提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        const prompt = await promptService_1.promptService.getPromptById(id);
        res.json({ data: prompt, message: '获取提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const prompt = await promptService_1.promptService.createPrompt(req.body);
        res.status(201).json({ data: prompt, message: '创建提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        const prompt = await promptService_1.promptService.updatePrompt(id, req.body);
        res.json({ data: prompt, message: '更新提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        await promptService_1.promptService.deletePrompt(id);
        res.json({ message: '删除提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/activate', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        const prompt = await promptService_1.promptService.activatePrompt(id);
        res.json({ data: prompt, message: '激活提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/deactivate', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        const { db } = require('../models/database');
        await db.run('UPDATE prompts SET is_active = 0 WHERE id = ?', [id]);
        const prompt = await promptService_1.promptService.getPromptById(id);
        res.json({ data: prompt, message: '停用提示词成功' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/preview', async (req, res, next) => {
    try {
        const { template, variables } = req.body;
        let preview = template;
        if (variables) {
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                preview = preview.replace(regex, variables[key] || '');
            });
        }
        res.json({ data: { preview }, message: '预览生成成功' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/versions', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: '缺少提示词ID' });
        }
        const prompt = await promptService_1.promptService.getPromptById(id);
        res.json({ data: [prompt], message: '获取版本历史成功' });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=promptRoutes.js.map