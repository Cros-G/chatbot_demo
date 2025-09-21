"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
class TemplateService {
    async getAllTemplates() {
        const templateRows = await database_1.db.all('SELECT * FROM templates ORDER BY created_at DESC');
        const templates = [];
        for (const templateRow of templateRows) {
            const template = await this.buildTemplateFromRow(templateRow);
            templates.push(template);
        }
        return templates;
    }
    async getTemplateById(id) {
        const templateRow = await database_1.db.get('SELECT * FROM templates WHERE id = ?', [id]);
        if (!templateRow) {
            throw new errorHandler_1.NotFoundError('模板不存在', { templateId: id });
        }
        return this.buildTemplateFromRow(templateRow);
    }
    async createTemplate(templateData) {
        const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [templateData.task_id]);
        if (!task) {
            throw new errorHandler_1.NotFoundError('指定的任务不存在', { taskId: templateData.task_id });
        }
        const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [templateData.role_id]);
        if (!role) {
            throw new errorHandler_1.NotFoundError('指定的角色不存在', { roleId: templateData.role_id });
        }
        const templateId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run('INSERT INTO templates (id, name, task_id, role_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [templateId, templateData.name, templateData.task_id, templateData.role_id, templateData.description || null, now, now]);
        return this.getTemplateById(templateId);
    }
    async updateTemplate(id, templateData) {
        const existingTemplate = await database_1.db.get('SELECT * FROM templates WHERE id = ?', [id]);
        if (!existingTemplate) {
            throw new errorHandler_1.NotFoundError('模板不存在', { templateId: id });
        }
        const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [templateData.task_id]);
        if (!task) {
            throw new errorHandler_1.NotFoundError('指定的任务不存在', { taskId: templateData.task_id });
        }
        const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [templateData.role_id]);
        if (!role) {
            throw new errorHandler_1.NotFoundError('指定的角色不存在', { roleId: templateData.role_id });
        }
        const now = new Date().toISOString();
        await database_1.db.run('UPDATE templates SET name = ?, task_id = ?, role_id = ?, description = ?, updated_at = ? WHERE id = ?', [templateData.name, templateData.task_id, templateData.role_id, templateData.description || null, now, id]);
        return this.getTemplateById(id);
    }
    async deleteTemplate(id) {
        const template = await database_1.db.get('SELECT * FROM templates WHERE id = ?', [id]);
        if (!template) {
            throw new errorHandler_1.NotFoundError('模板不存在', { templateId: id });
        }
        await database_1.db.run('DELETE FROM templates WHERE id = ?', [id]);
    }
    async buildTemplateFromRow(templateRow) {
        const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [templateRow.task_id]);
        const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [templateRow.role_id]);
        const template = {
            id: templateRow.id,
            name: templateRow.name,
            task_id: templateRow.task_id,
            role_id: templateRow.role_id,
            created_at: new Date(templateRow.created_at),
            updated_at: new Date(templateRow.updated_at)
        };
        if (templateRow.description) {
            template.description = templateRow.description;
        }
        if (task) {
            const taskInfo = {
                id: task.id,
                name: task.name,
                phases: [],
                created_at: new Date(task.created_at),
                updated_at: new Date(task.updated_at)
            };
            if (task.description) {
                taskInfo.description = task.description;
            }
            template.task = taskInfo;
        }
        if (role) {
            template.role = {
                id: role.id,
                name: role.name,
                personality: role.personality,
                speaking_style: role.speaking_style,
                background: role.background,
                created_at: new Date(role.created_at),
                updated_at: new Date(role.updated_at)
            };
        }
        return template;
    }
}
exports.templateService = new TemplateService();
//# sourceMappingURL=templateService.js.map