import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Task, Role, Message } from '../types';
import { promptService } from './promptService';

// 加载环境变量
dotenv.config({ path: '/Users/gongqipeng/Desktop/chatbot-demo/env' });

class OpenAIService {
  private openaiClient: OpenAI;
  private aliyunClient?: OpenAI;

  constructor() {
    // OpenAI客户端
    const openaiApiKey = process.env['OPENAI_API_KEY'];
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    this.openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });

    // 阿里云百炼客户端 (兼容OpenAI API格式)
    const aliyunApiKey = process.env['ALI_API_KEY'];
    if (aliyunApiKey) {
      this.aliyunClient = new OpenAI({
        apiKey: aliyunApiKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });
    }
  }

  /**
   * 根据模型名称获取对应的客户端
   */
  private getClient(model: string): OpenAI {
    if (model.startsWith('qwen-')) {
      if (!this.aliyunClient) {
        throw new Error('阿里云API密钥未配置');
      }
      return this.aliyunClient;
    }
    return this.openaiClient;
  }

  /**
   * 根据任务、角色和对话历史生成AI回复
   */
  async generateResponse(
    task: Task | undefined,
    role: Role | undefined,
    messages: Message[],
    memoryWindowSize: number = 10,
    model: string = 'gpt-4o-mini',
    customSystemPrompt?: string
  ): Promise<string> {
    try {
      // 使用自定义系统提示词或默认构建
      const systemPrompt = customSystemPrompt || await promptService.buildSystemPrompt(task, role);
      
      // 构建对话历史（限制窗口大小）
      const conversationHistory = this.buildConversationHistory(messages, memoryWindowSize);
      
      // 根据模型选择对应的客户端
      const client = this.getClient(model);
      
      // 调用AI API
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
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // 提供友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('AI服务暂时繁忙，请稍后再试');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('AI服务配额不足，请联系管理员');
        } else if (error.message.includes('invalid_api_key')) {
          throw new Error('AI服务配置错误，请联系管理员');
        }
      }
      
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  }


  /**
   * 构建对话历史
   */
  private buildConversationHistory(
    messages: Message[], 
    memoryWindowSize: number
  ): Array<{ role: 'user' | 'assistant', content: string }> {
    // 取最近的N条消息，但排除最后一条（因为那是刚发送的用户消息，还没有AI回复）
    const recentMessages = messages.slice(-memoryWindowSize);
    
    return recentMessages.map(message => ({
      role: message.role,
      content: message.content
    }));
  }

  /**
   * 健康检查 - 验证AI服务连接
   */
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      
      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
