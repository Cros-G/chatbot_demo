"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
class PromptService {
    async getAllPrompts() {
        const rows = await database_1.db.all('SELECT * FROM prompts ORDER BY category, name');
        return rows.map(this.mapRowToPrompt);
    }
    async getPromptById(id) {
        const row = await database_1.db.get('SELECT * FROM prompts WHERE id = ?', [id]);
        if (!row) {
            throw new errorHandler_1.NotFoundError('提示词不存在', { promptId: id });
        }
        return this.mapRowToPrompt(row);
    }
    async getActivePromptByCategory(category) {
        const row = await database_1.db.get('SELECT * FROM prompts WHERE category = ? AND is_active = 1 ORDER BY version DESC LIMIT 1', [category]);
        return row ? this.mapRowToPrompt(row) : null;
    }
    async createPrompt(promptData) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const variables = JSON.stringify(promptData.variables || []);
        await database_1.db.run('UPDATE prompts SET is_active = 0 WHERE category = ?', [promptData.category]);
        await database_1.db.run(`INSERT INTO prompts (id, name, category, template, version, is_active, variables, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)`, [id, promptData.name, promptData.category, promptData.template, variables, now, now]);
        return this.getPromptById(id);
    }
    async updatePrompt(id, promptData) {
        await this.getPromptById(id);
        const now = new Date().toISOString();
        const updates = [];
        const values = [];
        if (promptData.name) {
            updates.push('name = ?');
            values.push(promptData.name);
        }
        if (promptData.template) {
            updates.push('template = ?', 'version = version + 1');
            values.push(promptData.template);
        }
        if (promptData.variables) {
            updates.push('variables = ?');
            values.push(JSON.stringify(promptData.variables));
        }
        updates.push('updated_at = ?');
        values.push(now, id);
        await database_1.db.run(`UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getPromptById(id);
    }
    async deletePrompt(id) {
        await this.getPromptById(id);
        await database_1.db.run('DELETE FROM prompts WHERE id = ?', [id]);
    }
    async activatePrompt(id) {
        const prompt = await this.getPromptById(id);
        await database_1.db.run('UPDATE prompts SET is_active = 0 WHERE category = ? AND id != ?', [prompt.category, id]);
        await database_1.db.run('UPDATE prompts SET is_active = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
        return this.getPromptById(id);
    }
    async getPromptVersions(name) {
        const rows = await database_1.db.all('SELECT * FROM prompts WHERE name = ? ORDER BY version DESC', [name]);
        return rows.map(this.mapRowToPrompt);
    }
    async getVersionStats() {
        const rows = await database_1.db.all(`SELECT 
         name, 
         category,
         COUNT(*) as versions,
         MAX(CASE WHEN is_active = 1 THEN version END) as active_version
       FROM prompts 
       GROUP BY name, category
       ORDER BY category, name`);
        return rows;
    }
    async migrateCoachToSystem() {
        await database_1.db.run('UPDATE prompts SET is_active = 0 WHERE category = ?', ['system']);
        await database_1.db.run('UPDATE prompts SET category = ?, updated_at = ? WHERE category = ?', ['system', new Date().toISOString(), 'coach']);
    }
    async renderPrompt(category, variables) {
        const prompt = await this.getActivePromptByCategory(category);
        if (!prompt) {
            throw new errorHandler_1.NotFoundError(`没有找到激活的${category}类型提示词`);
        }
        return this.replaceVariables(prompt.template, variables);
    }
    async buildSystemPrompt(task, role) {
        const systemPrompt = await this.getActivePromptByCategory('system');
        if (!systemPrompt) {
            throw new Error('系统提示词未配置');
        }
        const variables = {
            'role.name': role?.name || '',
            'role.personality': role?.personality || '',
            'role.speaking_style': role?.speaking_style || '',
            'role.background': role?.background || '',
            'task.name': task?.name || '',
            'task.description': task?.description || '',
            'task.phases': this.formatTaskPhases(task)
        };
        return this.replaceVariables(systemPrompt.template, variables);
    }
    replaceVariables(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            result = result.replace(regex, String(value || ''));
        }
        return result;
    }
    formatTaskPhases(task) {
        if (!task || !task.phases || task.phases.length === 0) {
            return '';
        }
        let phases = '\n## 训练要点\n';
        task.phases.forEach((phase, index) => {
            phases += `\n### 阶段${index + 1}：${phase.name}\n`;
            if (phase.key_behaviors && phase.key_behaviors.length > 0) {
                phases += `关键行为：\n`;
                phase.key_behaviors.forEach(behavior => {
                    const prefix = behavior.type === 'positive' ? '✓' : '✗';
                    phases += `${prefix} ${behavior.description}\n`;
                });
            }
            if (phase.key_phrases && phase.key_phrases.length > 0) {
                phases += `关键话术：\n`;
                phase.key_phrases.forEach(phrase => {
                    phases += `• ${phrase}\n`;
                });
            }
        });
        return phases;
    }
    mapRowToPrompt(row) {
        return {
            id: row.id,
            name: row.name,
            category: row.category,
            template: row.template,
            version: row.version,
            is_active: Boolean(row.is_active),
            variables: row.variables ? JSON.parse(row.variables) : [],
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }
    async initializeDefaultPrompts() {
        const existingPrompts = await this.getAllPrompts();
        if (existingPrompts.length > 0) {
            return;
        }
        await this.createPrompt({
            name: '基础系统提示词',
            category: 'system',
            template: `你是一个专业的AI陪练助手。

## 角色设定
你现在扮演：\${role.name}
性格特点：\${role.personality}
说话风格：\${role.speaking_style}
背景信息：\${role.background}
请严格按照这个角色的特点来回复，保持角色的一致性。

## 训练任务
当前训练任务：\${task.name}
任务描述：\${task.description}
\${task.phases}

请围绕这个训练任务进行对话，帮助用户练习和提升相关技能。`,
            variables: ['role.name', 'role.personality', 'role.speaking_style', 'role.background', 'task.name', 'task.description', 'task.phases']
        });
        await this.createPrompt({
            name: '基础陪练指导',
            category: 'coach',
            template: `## 对话原则
1. 保持专业和友好的态度
2. 根据用户的回复给出建设性的反馈
3. 适时提供指导和建议
4. 保持对话的自然流畅
5. 鼓励用户积极参与练习`,
            variables: []
        });
        await this.createPrompt({
            name: '对话评估分析',
            category: 'evaluation',
            template: `你是一个专业的对话评估专家。请对以下对话进行全面分析和评估。

## 对话记录
\${conversation.history}

## 评估要求
请从以下几个维度对此次对话进行评估：

### 1. 沟通效果评估
- 学员的表达是否清晰、准确
- 是否达到了预期的沟通目标
- 整体对话流畅度如何

### 2. 技能运用分析
- 学员运用了哪些有效的沟通技巧
- 哪些关键技能还需要加强
- 在关键节点的处理是否得当

### 3. 改进建议
- 具体的改进点和建议
- 下一步练习的重点方向
- 可以参考的优化策略

### 4. 亮点总结
- 对话中表现优秀的地方
- 值得保持和发扬的优点

请提供详细、具体、可操作的评估意见，帮助学员更好地提升沟通技能。`,
            variables: ['conversation.history']
        });
    }
}
exports.promptService = new PromptService();
//# sourceMappingURL=promptService.js.map