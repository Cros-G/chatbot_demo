import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { 
  Conversation, 
  ConversationCreateRequest, 
  MessageCreateRequest,
  ConversationRow,
  MessageRow,
  TaskRow,
  RoleRow,
  TemplateRow,
  Message,
  PsychologicalState,
} from '../types';
import { NotFoundError } from '../middleware/errorHandler';
import { openaiService } from './openaiService';
import { aiResponseParser } from './aiResponseParser';
import { psychologicalStateManager } from './psychologicalStateManager';
import { promptService } from './promptService';
import { auditService } from './auditService';
import { systemSettingsService } from './systemSettingsService';

class ConversationService {
  async getAllConversations(): Promise<Conversation[]> {
    const conversationRows = await db.all<ConversationRow>(
      'SELECT * FROM conversations ORDER BY updated_at DESC'
    );
    
    const conversations: Conversation[] = [];
    for (const conversationRow of conversationRows) {
      const conversation = await this.buildConversationFromRow(conversationRow, false); // 不加载消息
      conversations.push(conversation);
    }
    
    return conversations;
  }

  async getConversationById(id: string): Promise<Conversation> {
    const conversationRow = await db.get<ConversationRow>(
      'SELECT * FROM conversations WHERE id = ?', 
      [id]
    );
    
    if (!conversationRow) {
      throw new NotFoundError('对话不存在', { conversationId: id });
    }
    
    return this.buildConversationFromRow(conversationRow, true); // 加载消息
  }

  async createConversation(conversationData: ConversationCreateRequest): Promise<Conversation> {
    const conversationId = uuidv4();
    const now = new Date().toISOString();
    
    // 如果使用模板，获取模板信息
    if (conversationData.template_id) {
      const template = await db.get<TemplateRow>(
        'SELECT * FROM templates WHERE id = ?', 
        [conversationData.template_id]
      );
      if (!template) {
        throw new NotFoundError('指定的模板不存在', { templateId: conversationData.template_id });
      }
      
      // 从模板获取任务和角色ID
      conversationData.task_id = template.task_id;
      conversationData.role_id = template.role_id;
    }
    
    // 验证任务和角色存在
    if (conversationData.task_id) {
      const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [conversationData.task_id]);
      if (!task) {
        throw new NotFoundError('指定的任务不存在', { taskId: conversationData.task_id });
      }
    }
    
    if (conversationData.role_id) {
      const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [conversationData.role_id]);
      if (!role) {
        throw new NotFoundError('指定的角色不存在', { roleId: conversationData.role_id });
      }
    }
    
    await db.run(
      `INSERT INTO conversations (id, name, task_id, role_id, template_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversationId, 
        conversationData.name, 
        conversationData.task_id || null, 
        conversationData.role_id || null, 
        conversationData.template_id || null, 
        'active', 
        now, 
        now
      ]
    );
    
    return this.getConversationById(conversationId);
  }

  async updateConversation(id: string, updateData: Partial<ConversationCreateRequest>): Promise<Conversation> {
    // 检查对话是否存在
    const existingConversation = await db.get<ConversationRow>(
      'SELECT * FROM conversations WHERE id = ?', 
      [id]
    );
    if (!existingConversation) {
      throw new NotFoundError('对话不存在', { conversationId: id });
    }
    
    const now = new Date().toISOString();
    
    // 更新对话信息（主要是名称）
    await db.run(
      'UPDATE conversations SET name = ?, updated_at = ? WHERE id = ?',
      [updateData.name || existingConversation.name, now, id]
    );
    
    return this.getConversationById(id);
  }

  async deleteConversation(id: string): Promise<void> {
    const conversation = await db.get<ConversationRow>(
      'SELECT * FROM conversations WHERE id = ?', 
      [id]
    );
    if (!conversation) {
      throw new NotFoundError('对话不存在', { conversationId: id });
    }
    
    // 由于设置了外键约束，删除对话会级联删除相关消息
    await db.run('DELETE FROM conversations WHERE id = ?', [id]);
  }

  async sendMessage(conversationId: string, messageData: MessageCreateRequest): Promise<Message> {
    // 检查对话是否存在
    const conversation = await db.get<ConversationRow>(
      'SELECT * FROM conversations WHERE id = ?', 
      [conversationId]
    );
    if (!conversation) {
      throw new NotFoundError('对话不存在', { conversationId });
    }
    
    const messageId = uuidv4();
    const now = new Date().toISOString();
    
    await db.run(
      'INSERT INTO messages (id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
      [messageId, conversationId, messageData.role, messageData.content, now]
    );
    
    // 更新对话的最后更新时间
    await db.run(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      [now, conversationId]
    );
    
    // 返回创建的消息
    const messageRow = await db.get<MessageRow>(
      'SELECT * FROM messages WHERE id = ?', 
      [messageId]
    );
    
    return this.buildMessageFromRow(messageRow!);
  }

  async sendMessageWithAIReply(conversationId: string, userMessage: string, model?: string): Promise<{ userMessage: Message, aiMessage: Message }> {
    // 0. 获取系统设置（模型和记忆窗口大小）
    const actualModel = model || await systemSettingsService.getDefaultModel();
    const memoryWindowSize = await systemSettingsService.getMemoryWindowSize();
    
    // 1. 发送用户消息
    const userMessageData = await this.sendMessage(conversationId, {
      role: 'user',
      content: userMessage
    });

    try {
      // 2. 获取对话完整信息
      const conversationWithDetails = await this.getConversationById(conversationId);
      const task = conversationWithDetails.task;
      const role = conversationWithDetails.role;
      const messages = conversationWithDetails.messages;

      // 3. 获取或初始化心理状态
      const currentState = await this.getCurrentPsychologicalState(conversationId, task, role);

      // 4. 构建包含心理状态的系统提示词
      const systemPromptWithState = await this.buildSystemPromptWithState(task, role, currentState);
      
      // 5. 生成AI回复（带重试机制）
      const aiReplyContent = await this.generateAIResponseWithRetry(
        task, role, messages, currentState, actualModel, memoryWindowSize, 3, systemPromptWithState, conversationId, userMessageData.id
      );

      // 5. 解析AI回复
      const parsedResponse = aiResponseParser.parseResponse(aiReplyContent);
      if (!parsedResponse.isValid) {
        throw new Error('AI回复格式无效');
      }

      // 6. 更新心理状态
      let updatedState = currentState;
      if (parsedResponse.progressStatus) {
        updatedState = psychologicalStateManager.updateProgressStatus(updatedState, parsedResponse.progressStatus);
      }
      if (parsedResponse.keyPointsUpdate) {
        updatedState = psychologicalStateManager.updateKeyPoints(updatedState, parsedResponse.keyPointsUpdate);
      }

      // 7. 保存AI消息和心理状态
      const aiMessageData = await this.sendMessageWithState(conversationId, {
        role: 'assistant',
        content: parsedResponse.response || aiReplyContent
      }, updatedState, parsedResponse.progressStatus);

      // 8. 保存状态历史记录
      await this.saveConversationState(conversationId, userMessageData.id, userMessage, updatedState, parsedResponse.progressStatus);

      return {
        userMessage: userMessageData,
        aiMessage: aiMessageData
      };

    } catch (error) {
      console.error('AI对话处理失败:', error);
      
      // 降级处理：返回错误消息
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

  private async buildConversationFromRow(conversationRow: ConversationRow, includeMessages: boolean = false): Promise<Conversation> {
    const conversation: Conversation = {
      id: conversationRow.id,
      name: conversationRow.name,
      status: conversationRow.status as 'active' | 'completed',
      messages: [],
      created_at: new Date(conversationRow.created_at),
      updated_at: new Date(conversationRow.updated_at)
    };

    // 添加可选字段
    if (conversationRow.task_id) {
      conversation.task_id = conversationRow.task_id;
    }
    if (conversationRow.role_id) {
      conversation.role_id = conversationRow.role_id;
    }
    if (conversationRow.template_id) {
      conversation.template_id = conversationRow.template_id;
    }

    // 获取关联信息
    if (conversationRow.task_id) {
      const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [conversationRow.task_id]);
      if (task) {
        conversation.task = {
          id: task.id,
          name: task.name,
          phases: [], // 对话列表不需要详细phases
          created_at: new Date(task.created_at),
          updated_at: new Date(task.updated_at)
        };
        if (task.description) {
          conversation.task.description = task.description;
        }
      }
    }

    if (conversationRow.role_id) {
      const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [conversationRow.role_id]);
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
      const template = await db.get<TemplateRow>('SELECT * FROM templates WHERE id = ?', [conversationRow.template_id]);
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

    // 加载消息（如果需要）
    if (includeMessages) {
      const messageRows = await db.all<MessageRow>(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
        [conversationRow.id]
      );
      
      conversation.messages = messageRows.map(this.buildMessageFromRow);
    }

    return conversation;
  }

  private buildMessageFromRow(messageRow: MessageRow): Message {
    const message: Message = {
      id: messageRow.id,
      conversation_id: messageRow.conversation_id,
      role: messageRow.role as 'user' | 'assistant',
      content: messageRow.content,
      timestamp: new Date(messageRow.timestamp)
    };

    // 添加心理状态信息（如果存在）
    if (messageRow.psychological_state) {
      try {
        message.psychological_state = JSON.parse(messageRow.psychological_state);
      } catch (error) {
        console.warn('解析心理状态失败:', error);
      }
    }

    if (messageRow.progress_status) {
      try {
        message.progress_status = JSON.parse(messageRow.progress_status);
      } catch (error) {
        console.warn('解析进度状态失败:', error);
      }
    }

    return message;
  }

  /**
   * 获取当前心理状态
   */
  private async getCurrentPsychologicalState(conversationId: string, task: any, role: any): Promise<PsychologicalState> {
    // 尝试从最近的AI消息中获取心理状态
    const lastAIMessage = await db.get<MessageRow>(
      `SELECT * FROM messages 
       WHERE conversation_id = ? AND role = 'assistant' AND psychological_state IS NOT NULL 
       ORDER BY timestamp DESC LIMIT 1`,
      [conversationId]
    );

    if (lastAIMessage && lastAIMessage.psychological_state) {
      try {
        return JSON.parse(lastAIMessage.psychological_state);
      } catch (error) {
        console.warn('解析历史心理状态失败:', error);
      }
    }

    // 如果没有历史状态，从system prompt初始化
    const systemPrompt = await this.buildSystemPromptForState(task, role);
    return psychologicalStateManager.initializeFromPrompt(systemPrompt);
  }

  /**
   * 生成AI回复（带重试机制）
   */
  private async generateAIResponseWithRetry(
    task: any, 
    role: any, 
    messages: Message[], 
    _currentState: PsychologicalState, 
    model: string, 
    memoryWindowSize: number,
    maxRetries: number,
    systemPrompt: string,
    conversationId?: string,
    userMessageId?: string
  ): Promise<string> {
    const userInput = messages[messages.length - 1]?.content || '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 调用OpenAI生成回复，传递包含心理状态的系统提示词
        const response = await openaiService.generateResponse(task, role, messages, memoryWindowSize, model, systemPrompt);
        
        // 验证回复格式
        const parsed = aiResponseParser.parseResponse(response);
        
        // 记录审计日志
        await auditService.logAIInteraction({
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
        
      } catch (error) {
        console.error(`尝试 ${attempt}/${maxRetries} 失败:`, error);
        
        // 记录错误的审计日志
        await auditService.logAIInteraction({
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

  /**
   * 发送消息并保存心理状态
   */
  private async sendMessageWithState(
    conversationId: string, 
    messageData: MessageCreateRequest, 
    psychologicalState: PsychologicalState,
    progressStatus: any
  ): Promise<Message> {
    const messageId = uuidv4();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO messages (id, conversation_id, role, content, timestamp, psychological_state, progress_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        messageId, 
        conversationId, 
        messageData.role, 
        messageData.content, 
        now,
        JSON.stringify(psychologicalState),
        progressStatus ? JSON.stringify(progressStatus) : null
      ]
    );
    
    // 更新对话的最后更新时间
    await db.run(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      [now, conversationId]
    );
    
    // 返回创建的消息
    const messageRow = await db.get<MessageRow>(
      'SELECT * FROM messages WHERE id = ?', 
      [messageId]
    );
    
    return this.buildMessageFromRow(messageRow!);
  }

  /**
   * 保存对话状态历史
   */
  private async saveConversationState(
    conversationId: string,
    messageId: string,
    userMessageContent: string,
    psychologicalState: PsychologicalState,
    progressStatus: any
  ): Promise<void> {
    const stateId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO conversation_states (id, conversation_id, message_id, user_message_content, psychological_state, progress_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stateId,
        conversationId,
        messageId,
        userMessageContent,
        JSON.stringify(psychologicalState),
        progressStatus ? JSON.stringify(progressStatus) : '{}',
        now
      ]
    );
  }


  /**
   * 构建包含心理状态的系统提示词
   */
  private async buildSystemPromptWithState(task: any, role: any, currentState: PsychologicalState): Promise<string> {
    try {
      // 获取基础系统提示词
      const baseSystemPrompt = await promptService.buildSystemPrompt(task, role);
      
      // 生成心理状态文本
      const stateText = psychologicalStateManager.generateStateText(currentState);
      
      // 将心理状态注入到系统提示词中
      const systemPromptWithState = baseSystemPrompt.replace(
        /<当前心理状态>[\s\S]*?<\/当前心理状态>/,
        `<当前心理状态>\n${stateText}\n</当前心理状态>`
      );
      
      return systemPromptWithState;
    } catch (error) {
      console.error('构建包含心理状态的系统提示词失败:', error);
      // 降级处理：返回基础模板
      return `你是一个AI陪练角色。

<此前的心理状态>
初始状态
</此前的心理状态>

请按照要求的格式回复，包含progress_status、key_points_update和response三个部分。`;
    }
  }

  /**
   * 构建基础system prompt（用于初始化心理状态）
   */
  private async buildSystemPromptForState(task: any, role: any): Promise<string> {
    // 调用promptService获取真正的激活系统提示词
    try {
      return await promptService.buildSystemPrompt(task, role);
    } catch (error) {
      console.error('获取系统提示词失败，使用默认模板:', error);
      // 降级处理：返回基础模板
      return `你是一个AI陪练角色。

<此前的心理状态>
初始状态
</此前的心理状态>

请按照要求的格式回复，包含progress_status、key_points_update和response三个部分。`;
    }
  }
}

export const conversationService = new ConversationService();
