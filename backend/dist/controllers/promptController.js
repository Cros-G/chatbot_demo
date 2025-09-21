"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptController = void 0;
const promptService_1 = require("../services/promptService");
const variableService_1 = require("../services/variableService");
const taskService_1 = require("../services/taskService");
const roleService_1 = require("../services/roleService");
const errorHandler_1 = require("../middleware/errorHandler");
class PromptController {
    async getAllPrompts(_req, res, next) {
        try {
            const prompts = await promptService_1.promptService.getAllPrompts();
            res.json({ data: prompts });
        }
        catch (error) {
            next(error);
        }
    }
    async getPromptById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('提示词ID不能为空');
            }
            const prompt = await promptService_1.promptService.getPromptById(id);
            res.json({ data: prompt });
        }
        catch (error) {
            next(error);
        }
    }
    async createPrompt(req, res, next) {
        try {
            const promptData = req.body;
            if (!promptData.name || !promptData.category || !promptData.template) {
                throw new errorHandler_1.ValidationError('名称、分类和模板内容不能为空');
            }
            if (!['system', 'evaluation'].includes(promptData.category)) {
                throw new errorHandler_1.ValidationError('分类必须是 system 或 evaluation');
            }
            const prompt = await promptService_1.promptService.createPrompt(promptData);
            res.status(201).json({
                data: prompt,
                message: '提示词创建成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePrompt(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('提示词ID不能为空');
            }
            const promptData = req.body;
            const prompt = await promptService_1.promptService.updatePrompt(id, promptData);
            res.json({
                data: prompt,
                message: '提示词更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePrompt(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('提示词ID不能为空');
            }
            await promptService_1.promptService.deletePrompt(id);
            res.json({ message: '提示词删除成功' });
        }
        catch (error) {
            next(error);
        }
    }
    async activatePrompt(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('提示词ID不能为空');
            }
            const prompt = await promptService_1.promptService.activatePrompt(id);
            res.json({
                data: prompt,
                message: '提示词激活成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async previewPrompt(req, res, next) {
        try {
            const { template, variables } = req.body;
            if (!template) {
                throw new errorHandler_1.ValidationError('模板内容不能为空');
            }
            const sampleVariables = await variableService_1.variableService.getSampleVariables();
            const finalVariables = { ...sampleVariables, ...variables };
            let preview = template;
            for (const [key, value] of Object.entries(finalVariables)) {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                preview = preview.replace(regex, String(value || ''));
            }
            res.json({
                data: {
                    preview,
                    variables: finalVariables
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPromptVersions(req, res, next) {
        try {
            const { name } = req.params;
            if (!name) {
                throw new errorHandler_1.ValidationError('提示词名称不能为空');
            }
            const versions = await promptService_1.promptService.getPromptVersions(decodeURIComponent(name));
            res.json({ data: versions });
        }
        catch (error) {
            next(error);
        }
    }
    async getVersionStats(_req, res, next) {
        try {
            const stats = await promptService_1.promptService.getVersionStats();
            res.json({ data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async migrateCoachToSystem(_req, res, next) {
        try {
            await promptService_1.promptService.migrateCoachToSystem();
            res.json({ message: 'Coach提示词已成功迁移到System类别' });
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentSystemPrompt(req, res, next) {
        try {
            const { taskId, roleId } = req.query;
            let task = undefined;
            let role = undefined;
            if (taskId && typeof taskId === 'string') {
                try {
                    task = await taskService_1.taskService.getTaskById(taskId);
                }
                catch (error) {
                    console.warn(`无法获取task ${taskId}:`, error);
                }
            }
            if (roleId && typeof roleId === 'string') {
                try {
                    role = await roleService_1.roleService.getRoleById(roleId);
                }
                catch (error) {
                    console.warn(`无法获取role ${roleId}:`, error);
                }
            }
            const activePrompt = await promptService_1.promptService.getActivePromptByCategory('system');
            if (!activePrompt) {
                throw new errorHandler_1.ValidationError('当前没有激活的系统提示词');
            }
            const systemPrompt = await promptService_1.promptService.buildSystemPrompt(task, role);
            res.json({
                data: {
                    prompt: systemPrompt,
                    template: activePrompt.template,
                    promptInfo: {
                        id: activePrompt.id,
                        name: activePrompt.name,
                        version: activePrompt.version,
                        updated_at: activePrompt.updated_at
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.promptController = new PromptController();
//# sourceMappingURL=promptController.js.map