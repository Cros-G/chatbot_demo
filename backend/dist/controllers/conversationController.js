"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationController = void 0;
const conversationService_1 = require("../services/conversationService");
const errorHandler_1 = require("../middleware/errorHandler");
class ConversationController {
    async getAllConversations(_req, res, next) {
        try {
            const conversations = await conversationService_1.conversationService.getAllConversations();
            res.json({ data: conversations });
        }
        catch (error) {
            next(error);
        }
    }
    async getConversationById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('对话ID不能为空');
            }
            const conversation = await conversationService_1.conversationService.getConversationById(id);
            res.json({ data: conversation });
        }
        catch (error) {
            next(error);
        }
    }
    async createConversation(req, res, next) {
        try {
            const conversationData = req.body;
            if (!conversationData.name) {
                throw new errorHandler_1.ValidationError('对话名称不能为空');
            }
            const hasTaskAndRole = conversationData.task_id && conversationData.role_id;
            const hasTemplate = conversationData.template_id;
            if (!hasTaskAndRole && !hasTemplate) {
                throw new errorHandler_1.ValidationError('请选择任务和角色，或选择模板');
            }
            const conversation = await conversationService_1.conversationService.createConversation(conversationData);
            res.status(201).json({
                data: conversation,
                message: '对话创建成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateConversation(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('对话ID不能为空');
            }
            const updateData = req.body;
            const conversation = await conversationService_1.conversationService.updateConversation(id, updateData);
            res.json({
                data: conversation,
                message: '对话更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteConversation(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('对话ID不能为空');
            }
            await conversationService_1.conversationService.deleteConversation(id);
            res.json({ message: '对话删除成功' });
        }
        catch (error) {
            next(error);
        }
    }
    async sendMessage(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('对话ID不能为空');
            }
            const messageData = req.body;
            if (!messageData.content || !messageData.role) {
                throw new errorHandler_1.ValidationError('消息内容和角色不能为空');
            }
            const message = await conversationService_1.conversationService.sendMessage(id, messageData);
            res.status(201).json({
                data: message,
                message: '消息发送成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendMessageWithAI(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('对话ID不能为空');
            }
            const { content, model } = req.body;
            if (!content) {
                throw new errorHandler_1.ValidationError('消息内容不能为空');
            }
            const result = await conversationService_1.conversationService.sendMessageWithAIReply(id, content, model);
            res.status(201).json({
                data: result,
                message: 'AI对话成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.conversationController = new ConversationController();
//# sourceMappingURL=conversationController.js.map