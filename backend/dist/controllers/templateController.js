"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateController = void 0;
const templateService_1 = require("../services/templateService");
const errorHandler_1 = require("../middleware/errorHandler");
class TemplateController {
    async getAllTemplates(_req, res, next) {
        try {
            const templates = await templateService_1.templateService.getAllTemplates();
            res.json({ data: templates });
        }
        catch (error) {
            next(error);
        }
    }
    async getTemplateById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('模板ID不能为空');
            }
            const template = await templateService_1.templateService.getTemplateById(id);
            res.json({ data: template });
        }
        catch (error) {
            next(error);
        }
    }
    async createTemplate(req, res, next) {
        try {
            const templateData = req.body;
            if (!templateData.name || !templateData.task_id || !templateData.role_id) {
                throw new errorHandler_1.ValidationError('模板名称、任务ID和角色ID不能为空');
            }
            const template = await templateService_1.templateService.createTemplate(templateData);
            res.status(201).json({
                data: template,
                message: '模板创建成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTemplate(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('模板ID不能为空');
            }
            const templateData = req.body;
            const template = await templateService_1.templateService.updateTemplate(id, templateData);
            res.json({
                data: template,
                message: '模板更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTemplate(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('模板ID不能为空');
            }
            await templateService_1.templateService.deleteTemplate(id);
            res.json({ message: '模板删除成功' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.templateController = new TemplateController();
//# sourceMappingURL=templateController.js.map