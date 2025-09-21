"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const systemSettingsService_1 = require("./systemSettingsService");
const promptService_1 = require("./promptService");
const openaiService_1 = require("./openaiService");
class EvaluationService {
    async getEvaluationsByConversation(conversationId) {
        const rows = await database_1.db.all('SELECT * FROM conversation_evaluations WHERE conversation_id = ? ORDER BY created_at DESC', [conversationId]);
        return rows.map(this.mapRowToEvaluation);
    }
    async extractConversationHistory(conversationId) {
        const messageRows = await database_1.db.all('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationId]);
        if (messageRows.length === 0) {
            return '暂无对话记录';
        }
        return messageRows.map(row => {
            const roleLabel = row.role === 'user' ? '学员' : '陪练角色';
            return `${roleLabel}: ${row.content}`;
        }).join('\n');
    }
    async canEvaluateConversation(conversationId) {
        const messageCount = await database_1.db.get('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?', [conversationId]);
        if ((messageCount?.count || 0) < 3) {
            return false;
        }
        try {
            await promptService_1.promptService.getActivePromptByCategory('evaluation');
            return true;
        }
        catch (error) {
            console.warn('没有找到激活的评估提示词:', error);
            return false;
        }
    }
    async createEvaluation(request) {
        const { conversation_id, model } = request;
        const canEvaluate = await this.canEvaluateConversation(conversation_id);
        if (!canEvaluate) {
            throw new Error('无法进行评估：对话消息数量不足（至少需要3条消息）或没有激活的评估提示词');
        }
        const evaluationModel = model || await systemSettingsService_1.systemSettingsService.getEvaluationDefaultModel();
        const conversationHistory = await this.extractConversationHistory(conversation_id);
        const evaluationPrompt = await promptService_1.promptService.renderPrompt('evaluation', {
            'conversation.history': conversationHistory
        });
        const evaluationContent = await openaiService_1.openaiService.generateResponse(undefined, undefined, [], 0, evaluationModel, evaluationPrompt);
        const evaluationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run(`INSERT INTO conversation_evaluations 
       (id, conversation_id, evaluation_content, model_used, conversation_history, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`, [evaluationId, conversation_id, evaluationContent, evaluationModel, conversationHistory, now]);
        const evaluationRow = await database_1.db.get('SELECT * FROM conversation_evaluations WHERE id = ?', [evaluationId]);
        return this.mapRowToEvaluation(evaluationRow);
    }
    async streamEvaluation(request) {
        const { conversation_id, model } = request;
        const canEvaluate = await this.canEvaluateConversation(conversation_id);
        if (!canEvaluate) {
            throw new Error('无法进行评估：对话消息数量不足（至少需要3条消息）或没有激活的评估提示词');
        }
        const evaluationModel = model || await systemSettingsService_1.systemSettingsService.getEvaluationDefaultModel();
        const conversationHistory = await this.extractConversationHistory(conversation_id);
        const evaluationPrompt = await promptService_1.promptService.renderPrompt('evaluation', {
            'conversation.history': conversationHistory
        });
        const evaluationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run(`INSERT INTO conversation_evaluations 
       (id, conversation_id, evaluation_content, model_used, conversation_history, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`, [evaluationId, conversation_id, '', evaluationModel, conversationHistory, now]);
        return {
            evaluationId,
            conversationHistory,
            model: evaluationModel,
            prompt: evaluationPrompt
        };
    }
    async updateStreamEvaluation(evaluationId, content) {
        await database_1.db.run('UPDATE conversation_evaluations SET evaluation_content = ? WHERE id = ?', [content, evaluationId]);
    }
    async deleteEvaluation(evaluationId) {
        await database_1.db.run('DELETE FROM conversation_evaluations WHERE id = ?', [evaluationId]);
    }
    mapRowToEvaluation(row) {
        return {
            id: row.id,
            conversation_id: row.conversation_id,
            evaluation_content: row.evaluation_content,
            model_used: row.model_used,
            conversation_history: row.conversation_history,
            created_at: new Date(row.created_at)
        };
    }
}
exports.evaluationService = new EvaluationService();
//# sourceMappingURL=evaluationService.js.map