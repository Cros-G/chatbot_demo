"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
const openaiService_1 = require("./openaiService");
const aiResponseParser_1 = require("./aiResponseParser");
const psychologicalStateManager_1 = require("./psychologicalStateManager");
const promptService_1 = require("./promptService");
const auditService_1 = require("./auditService");
const systemSettingsService_1 = require("./systemSettingsService");
class ConversationService {
    async getAllConversations() {
        const conversationRows = await database_1.db.all('SELECT * FROM conversations ORDER BY updated_at DESC');
        const conversations = [];
        for (const conversationRow of conversationRows) {
            const conversation = await this.buildConversationFromRow(conversationRow, false);
            conversations.push(conversation);
        }
        return conversations;
    }
    async getConversationById(id) {
        const conversationRow = await database_1.db.get('SELECT * FROM conversations WHERE id = ?', [id]);
        if (!conversationRow) {
            throw new errorHandler_1.NotFoundError('对话不存在', { conversationId: id });
        }
        return this.buildConversationFromRow(conversationRow, true);
    }
    async createConversation(conversationData) {
        const conversationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        if (conversationData.template_id) {
            const template = await database_1.db.get('SELECT * FROM templates WHERE id = ?', [conversationData.template_id]);
            if (!template) {
                throw new errorHandler_1.NotFoundError('指定的模板不存在', { templateId: conversationData.template_id });
            }
            conversationData.task_id = template.task_id;
            conversationData.role_id = template.role_id;
        }
        if (conversationData.task_id) {
            const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [conversationData.task_id]);
            if (!task) {
                throw new errorHandler_1.NotFoundError('指定的任务不存在', { taskId: conversationData.task_id });
            }
        }
        if (conversationData.role_id) {
            const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [conversationData.role_id]);
            if (!role) {
                throw new errorHandler_1.NotFoundError('指定的角色不存在', { roleId: conversationData.role_id });
            }
        }
        await database_1.db.run(`INSERT INTO conversations (id, name, task_id, role_id, template_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            conversationId,
            conversationData.name,
            conversationData.task_id || null,
            conversationData.role_id || null,
            conversationData.template_id || null,
            'active',
            now,
            now
        ]);
        return this.getConversationById(conversationId);
    }
    async updateConversation(id, updateData) {
        const existingConversation = await database_1.db.get('SELECT * FROM conversations WHERE id = ?', [id]);
        if (!existingConversation) {
            throw new errorHandler_1.NotFoundError('对话不存在', { conversationId: id });
        }
        const now = new Date().toISOString();
        await database_1.db.run('UPDATE conversations SET name = ?, updated_at = ? WHERE id = ?', [updateData.name || existingConversation.name, now, id]);
        return this.getConversationById(id);
    }
    async deleteConversation(id) {
        const conversation = await database_1.db.get('SELECT * FROM conversations WHERE id = ?', [id]);
        if (!conversation) {
            throw new errorHandler_1.NotFoundError('对话不存在', { conversationId: id });
        }
        await database_1.db.run('DELETE FROM conversations WHERE id = ?', [id]);
    }
    async sendMessage(conversationId, messageData) {
        const conversation = await database_1.db.get('SELECT * FROM conversations WHERE id = ?', [conversationId]);
        if (!conversation) {
            throw new errorHandler_1.NotFoundError('对话不存在', { conversationId });
        }
        const messageId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run('INSERT INTO messages (id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)', [messageId, conversationId, messageData.role, messageData.content, now]);
        await database_1.db.run('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId]);
        const messageRow = await database_1.db.get('SELECT * FROM messages WHERE id = ?', [messageId]);
        return this.buildMessageFromRow(messageRow);
    }
    async sendMessageWithAIReply(conversationId, userMessage, model) {
        const actualModel = model || await systemSettingsService_1.systemSettingsService.getDefaultModel();
        const memoryWindowSize = await systemSettingsService_1.systemSettingsService.getMemoryWindowSize();
        const userMessageData = await this.sendMessage(conversationId, {
            role: 'user',
            content: userMessage
        });
        try {
            const conversationWithDetails = await this.getConversationById(conversationId);
            const task = conversationWithDetails.task;
            const role = conversationWithDetails.role;
            const messages = conversationWithDetails.messages;
            const currentState = await this.getCurrentPsychologicalState(conversationId, task, role);
            const systemPromptWithState = await this.buildSystemPromptWithState(task, role, currentState);
            const aiReplyContent = await this.generateAIResponseWithRetry(task, role, messages, currentState, actualModel, memoryWindowSize, 3, systemPromptWithState, conversationId, userMessageData.id);
            const parsedResponse = aiResponseParser_1.aiResponseParser.parseResponse(aiReplyContent);
            if (!parsedResponse.isValid) {
                throw new Error('AI回复格式无效');
            }
            let updatedState = currentState;
            if (parsedResponse.progressStatus) {
                updatedState = psychologicalStateManager_1.psychologicalStateManager.updateProgressStatus(updatedState, parsedResponse.progressStatus);
            }
            if (parsedResponse.keyPointsUpdate) {
                updatedState = psychologicalStateManager_1.psychologicalStateManager.updateKeyPoints(updatedState, parsedResponse.keyPointsUpdate);
            }
            const aiMessageData = await this.sendMessageWithState(conversationId, {
                role: 'assistant',
                content: parsedResponse.response || aiReplyContent
            }, updatedState, parsedResponse.progressStatus);
            await this.saveConversationState(conversationId, userMessageData.id, userMessage, updatedState, parsedResponse.progressStatus);
            return {
                userMessage: userMessageData,
                aiMessage: aiMessageData
            };
        }
        catch (error) {
            console.error('AI对话处理失败:', error);
            const fallbackReply = '抱歉，我正在重新组织语言，请稍后再试。';
            const aiMessageData = await this.sendMessage(conversationId, {
                role: 'assistant',
                content: fallbackReply
            });
            return {
                userMessage: userMessageData,
                aiMessage: aiMessageData
            };
        }
    }
    async buildConversationFromRow(conversationRow, includeMessages = false) {
        const conversation = {
            id: conversationRow.id,
            name: conversationRow.name,
            status: conversationRow.status,
            messages: [],
            created_at: new Date(conversationRow.created_at),
            updated_at: new Date(conversationRow.updated_at)
        };
        if (conversationRow.task_id) {
            conversation.task_id = conversationRow.task_id;
        }
        if (conversationRow.role_id) {
            conversation.role_id = conversationRow.role_id;
        }
        if (conversationRow.template_id) {
            conversation.template_id = conversationRow.template_id;
        }
        if (conversationRow.task_id) {
            const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [conversationRow.task_id]);
            if (task) {
                conversation.task = {
                    id: task.id,
                    name: task.name,
                    phases: [],
                    created_at: new Date(task.created_at),
                    updated_at: new Date(task.updated_at)
                };
                if (task.description) {
                    conversation.task.description = task.description;
                }
            }
        }
        if (conversationRow.role_id) {
            const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [conversationRow.role_id]);
            if (role) {
                conversation.role = {
                    id: role.id,
                    name: role.name,
                    personality: role.personality,
                    speaking_style: role.speaking_style,
                    background: role.background,
                    created_at: new Date(role.created_at),
                    updated_at: new Date(role.updated_at)
                };
            }
        }
        if (conversationRow.template_id) {
            const template = await database_1.db.get('SELECT * FROM templates WHERE id = ?', [conversationRow.template_id]);
            if (template) {
                conversation.template = {
                    id: template.id,
                    name: template.name,
                    task_id: template.task_id,
                    role_id: template.role_id,
                    created_at: new Date(template.created_at),
                    updated_at: new Date(template.updated_at)
                };
                if (template.description) {
                    conversation.template.description = template.description;
                }
            }
        }
        if (includeMessages) {
            const messageRows = await database_1.db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationRow.id]);
            conversation.messages = messageRows.map(this.buildMessageFromRow);
        }
        return conversation;
    }
    buildMessageFromRow(messageRow) {
        const message = {
            id: messageRow.id,
            conversation_id: messageRow.conversation_id,
            role: messageRow.role,
            content: messageRow.content,
            timestamp: new Date(messageRow.timestamp)
        };
        if (messageRow.psychological_state) {
            try {
                message.psychological_state = JSON.parse(messageRow.psychological_state);
            }
            catch (error) {
                console.warn('解析心理状态失败:', error);
            }
        }
        if (messageRow.progress_status) {
            try {
                message.progress_status = JSON.parse(messageRow.progress_status);
            }
            catch (error) {
                console.warn('解析进度状态失败:', error);
            }
        }
        return message;
    }
    async getCurrentPsychologicalState(conversationId, task, role) {
        const lastAIMessage = await database_1.db.get(`SELECT * FROM messages 
       WHERE conversation_id = ? AND role = 'assistant' AND psychological_state IS NOT NULL 
       ORDER BY timestamp DESC LIMIT 1`, [conversationId]);
        if (lastAIMessage && lastAIMessage.psychological_state) {
            try {
                return JSON.parse(lastAIMessage.psychological_state);
            }
            catch (error) {
                console.warn('解析历史心理状态失败:', error);
            }
        }
        const systemPrompt = await this.buildSystemPromptForState(task, role);
        return psychologicalStateManager_1.psychologicalStateManager.initializeFromPrompt(systemPrompt);
    }
    async generateAIResponseWithRetry(task, role, messages, _currentState, model, memoryWindowSize, maxRetries, systemPrompt, conversationId, userMessageId) {
        const userInput = messages[messages.length - 1]?.content || '';
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await openaiService_1.openaiService.generateResponse(task, role, messages, memoryWindowSize, model, systemPrompt);
                const parsed = aiResponseParser_1.aiResponseParser.parseResponse(response);
                await auditService_1.auditService.logAIInteraction({
                    conversationId,
                    userMessageId,
                    systemPrompt,
                    userInput,
                    aiRawOutput: response,
                    aiParsedOutput: parsed.isValid ? JSON.stringify({
                        progressStatus: parsed.progressStatus,
                        keyPointsUpdate: parsed.keyPointsUpdate,
                        response: parsed.response
                    }) : undefined,
                    modelUsed: model,
                    isParsingSuccessful: parsed.isValid,
                    parsingError: parsed.isValid ? undefined : `解析失败: ${JSON.stringify(parsed)}`,
                    retryCount: attempt - 1
                });
                if (parsed.isValid) {
                    return response;
                }
                console.warn(`尝试 ${attempt}/${maxRetries}: AI回复格式无效，重试...`);
                console.log('AI原始回复:', response);
                console.log('解析结果:', JSON.stringify(parsed, null, 2));
            }
            catch (error) {
                console.error(`尝试 ${attempt}/${maxRetries} 失败:`, error);
                await auditService_1.auditService.logAIInteraction({
                    conversationId,
                    userMessageId,
                    systemPrompt,
                    userInput,
                    aiRawOutput: `错误: ${error}`,
                    modelUsed: model,
                    isParsingSuccessful: false,
                    parsingError: `API调用失败: ${error}`,
                    retryCount: attempt - 1
                });
                if (attempt === maxRetries) {
                    throw error;
                }
            }
        }
        throw new Error('AI回复生成失败，超过最大重试次数');
    }
    async sendMessageWithState(conversationId, messageData, psychologicalState, progressStatus) {
        const messageId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run(`INSERT INTO messages (id, conversation_id, role, content, timestamp, psychological_state, progress_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            messageId,
            conversationId,
            messageData.role,
            messageData.content,
            now,
            JSON.stringify(psychologicalState),
            progressStatus ? JSON.stringify(progressStatus) : null
        ]);
        await database_1.db.run('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId]);
        const messageRow = await database_1.db.get('SELECT * FROM messages WHERE id = ?', [messageId]);
        return this.buildMessageFromRow(messageRow);
    }
    async saveConversationState(conversationId, messageId, userMessageContent, psychologicalState, progressStatus) {
        const stateId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run(`INSERT INTO conversation_states (id, conversation_id, message_id, user_message_content, psychological_state, progress_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            stateId,
            conversationId,
            messageId,
            userMessageContent,
            JSON.stringify(psychologicalState),
            progressStatus ? JSON.stringify(progressStatus) : '{}',
            now
        ]);
    }
    async buildSystemPromptWithState(task, role, currentState) {
        try {
            const baseSystemPrompt = await promptService_1.promptService.buildSystemPrompt(task, role);
            const stateText = psychologicalStateManager_1.psychologicalStateManager.generateStateText(currentState);
            const systemPromptWithState = baseSystemPrompt.replace(/<当前心理状态>[\s\S]*?<\/当前心理状态>/, `<当前心理状态>\n${stateText}\n</当前心理状态>`);
            return systemPromptWithState;
        }
        catch (error) {
            console.error('构建包含心理状态的系统提示词失败:', error);
            return `你是一个AI陪练角色。

<此前的心理状态>
初始状态
</此前的心理状态>

请按照要求的格式回复，包含progress_status、key_points_update和response三个部分。`;
        }
    }
    async buildSystemPromptForState(task, role) {
        try {
            return await promptService_1.promptService.buildSystemPrompt(task, role);
        }
        catch (error) {
            console.error('获取系统提示词失败，使用默认模板:', error);
            return `你是一个AI陪练角色。

<此前的心理状态>
初始状态
</此前的心理状态>

请按照要求的格式回复，包含progress_status、key_points_update和response三个部分。`;
        }
    }
}
exports.conversationService = new ConversationService();
//# sourceMappingURL=conversationService.js.map