"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
class VariableService {
    async getAllVariables() {
        const rows = await database_1.db.all('SELECT * FROM variable_configs ORDER BY category, variable_name');
        return rows.map(this.mapRowToVariable);
    }
    async getVariableById(id) {
        const row = await database_1.db.get('SELECT * FROM variable_configs WHERE id = ?', [id]);
        if (!row) {
            throw new errorHandler_1.NotFoundError('变量配置不存在', { variableId: id });
        }
        return this.mapRowToVariable(row);
    }
    async updateVariable(id, data) {
        await this.getVariableById(id);
        const now = new Date().toISOString();
        const updates = [];
        const values = [];
        if (data.sample_value !== undefined) {
            updates.push('sample_value = ?');
            values.push(data.sample_value);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description);
        }
        updates.push('updated_at = ?');
        values.push(now, id);
        await database_1.db.run(`UPDATE variable_configs SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getVariableById(id);
    }
    async getSampleVariables() {
        const variables = await this.getAllVariables();
        const result = {};
        for (const variable of variables) {
            result[variable.variable_name] = variable.sample_value;
        }
        return result;
    }
    async getVariablesByCategory(category) {
        const rows = await database_1.db.all('SELECT * FROM variable_configs WHERE category = ? ORDER BY variable_name', [category]);
        return rows.map(this.mapRowToVariable);
    }
    async initializeDefaultVariables() {
        const existingVariables = await this.getAllVariables();
        if (existingVariables.length > 0) {
            return;
        }
        const defaultVariables = [
            {
                variable_name: 'role.name',
                sample_value: '销售专家',
                description: '角色名称，用于AI身份设定',
                category: 'role'
            },
            {
                variable_name: 'role.personality',
                sample_value: '热情开朗，积极主动',
                description: '角色性格特点',
                category: 'role'
            },
            {
                variable_name: 'role.speaking_style',
                sample_value: '亲切友好，专业自信',
                description: '角色说话风格',
                category: 'role'
            },
            {
                variable_name: 'role.background',
                sample_value: '拥有10年销售经验，擅长客户沟通',
                description: '角色背景信息',
                category: 'role'
            },
            {
                variable_name: 'task.name',
                sample_value: '销售沟通技巧',
                description: '训练任务名称',
                category: 'task'
            },
            {
                variable_name: 'task.description',
                sample_value: '提升销售人员与客户的沟通能力',
                description: '任务详细描述',
                category: 'task'
            },
            {
                variable_name: 'task.phases',
                sample_value: '\n## 训练要点\n\n### 阶段1：开场阶段\n关键行为：\n✓ 主动问候客户\n✗ 直接推销产品\n关键话术：\n• 您好，很高兴为您服务',
                description: '任务阶段信息（自动格式化）',
                category: 'task'
            },
            {
                variable_name: 'conversation.history',
                sample_value: '学员: 你好，我想了解这个产品\n陪练角色: 您好！很高兴为您介绍我们的产品...',
                description: '对话历史记录，用于评估分析',
                category: 'evaluation'
            }
        ];
        for (const variable of defaultVariables) {
            const id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            await database_1.db.run(`INSERT INTO variable_configs (id, variable_name, sample_value, description, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, variable.variable_name, variable.sample_value, variable.description, variable.category, now, now]);
        }
    }
    mapRowToVariable(row) {
        return {
            id: row.id,
            variable_name: row.variable_name,
            sample_value: row.sample_value,
            description: row.description || '',
            category: row.category,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }
}
exports.variableService = new VariableService();
//# sourceMappingURL=variableService.js.map