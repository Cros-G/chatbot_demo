"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiService = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const promptService_1 = require("./promptService");
dotenv_1.default.config({ path: '/Users/gongqipeng/Desktop/chatbot-demo/env' });
class OpenAIService {
    constructor() {
        const openaiApiKey = process.env['OPENAI_API_KEY'];
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not found in environment variables');
        }
        this.openaiClient = new openai_1.default({
            apiKey: openaiApiKey,
        });
        const aliyunApiKey = process.env['ALI_API_KEY'];
        if (aliyunApiKey) {
            this.aliyunClient = new openai_1.default({
                apiKey: aliyunApiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
        }
    }
    getClient(model) {
        if (model.startsWith('qwen-')) {
            if (!this.aliyunClient) {
                throw new Error('阿里云API密钥未配置');
            }
            return this.aliyunClient;
        }
        return this.openaiClient;
    }
    async generateResponse(task, role, messages, memoryWindowSize = 10, model = 'gpt-4o-mini', customSystemPrompt) {
        try {
            const systemPrompt = customSystemPrompt || await promptService_1.promptService.buildSystemPrompt(task, role);
            const conversationHistory = this.buildConversationHistory(messages, memoryWindowSize);
            const client = this.getClient(model);
            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory
                ],
                temperature: 0.3,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response generated from OpenAI');
            }
            return response.trim();
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            if (error instanceof Error) {
                if (error.message.includes('rate limit')) {
                    throw new Error('AI服务暂时繁忙，请稍后再试');
                }
                else if (error.message.includes('insufficient_quota')) {
                    throw new Error('AI服务配额不足，请联系管理员');
                }
                else if (error.message.includes('invalid_api_key')) {
                    throw new Error('AI服务配置错误，请联系管理员');
                }
            }
            throw new Error('AI服务暂时不可用，请稍后再试');
        }
    }
    buildConversationHistory(messages, memoryWindowSize) {
        const recentMessages = messages.slice(-memoryWindowSize);
        return recentMessages.map(message => ({
            role: message.role,
            content: message.content
        }));
    }
    async healthCheck() {
        try {
            const completion = await this.openaiClient.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
            });
            return !!completion.choices[0]?.message?.content;
        }
        catch (error) {
            console.error('OpenAI health check failed:', error);
            return false;
        }
    }
}
exports.openaiService = new OpenAIService();
//# sourceMappingURL=openaiService.js.map