import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { 
  ConversationEvaluation, 
  ConversationEvaluationRow, 
  EvaluationRequest,
  MessageRow
} from '../types';
import { systemSettingsService } from './systemSettingsService';
import { promptService } from './promptService';
import { openaiService } from './openaiService';

class EvaluationService {
  /**
   * 获取对话的所有评估记录
   */
  async getEvaluationsByConversation(conversationId: string): Promise<ConversationEvaluation[]> {
    const rows = await db.all<ConversationEvaluationRow>(
      'SELECT * FROM conversation_evaluations WHERE conversation_id = ? ORDER BY created_at DESC',
      [conversationId]
    );

    return rows.map(this.mapRowToEvaluation);
  }

  /**
   * 提取对话历史（纯对话内容，不包含心理状态等元数据）
   */
  async extractConversationHistory(conversationId: string): Promise<string> {
    const messageRows = await db.all<MessageRow>(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [conversationId]
    );

    if (messageRows.length === 0) {
      return '暂无对话记录';
    }

    return messageRows.map(row => {
      const roleLabel = row.role === 'user' ? '学员' : '陪练角色';
      return `${roleLabel}: ${row.content}`;
    }).join('\n');
  }

  /**
   * 检查对话是否满足评估条件（至少3条消息 + 存在激活的评估提示词）
   */
  async canEvaluateConversation(conversationId: string): Promise<boolean> {
    // 检查消息数量
    const messageCount = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      [conversationId]
    );

    if ((messageCount?.count || 0) < 3) {
      return false;
    }

    // 检查是否存在激活的评估提示词
    try {
      await promptService.getActivePromptByCategory('evaluation');
      return true;
    } catch (error) {
      console.warn('没有找到激活的评估提示词:', error);
      return false;
    }
  }

  /**
   * 创建对话评估
   */
  async createEvaluation(request: EvaluationRequest): Promise<ConversationEvaluation> {
    const { conversation_id, model } = request;

    // 检查评估条件
    const canEvaluate = await this.canEvaluateConversation(conversation_id);
    if (!canEvaluate) {
      throw new Error('无法进行评估：对话消息数量不足（至少需要3条消息）或没有激活的评估提示词');
    }

    // 获取评估模型
    const evaluationModel = model || await systemSettingsService.getEvaluationDefaultModel();

    // 提取对话历史
    const conversationHistory = await this.extractConversationHistory(conversation_id);

    // 构建评估提示词
    const evaluationPrompt = await promptService.renderPrompt('evaluation', {
      'conversation.history': conversationHistory
    });

    // 调用AI进行评估
    const evaluationContent = await openaiService.generateResponse(
      undefined, // 评估不需要task
      undefined, // 评估不需要role  
      [], // 评估不需要历史消息
      0, // 评估不需要记忆窗口
      evaluationModel,
      evaluationPrompt
    );

    // 保存评估结果
    const evaluationId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO conversation_evaluations 
       (id, conversation_id, evaluation_content, model_used, conversation_history, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [evaluationId, conversation_id, evaluationContent, evaluationModel, conversationHistory, now]
    );

    // 返回创建的评估记录
    const evaluationRow = await db.get<ConversationEvaluationRow>(
      'SELECT * FROM conversation_evaluations WHERE id = ?',
      [evaluationId]
    );

    return this.mapRowToEvaluation(evaluationRow!);
  }

  /**
   * 流式评估（用于实时显示）
   * 注意：这是一个简化版本，实际的流式实现需要在路由层处理
   */
  async streamEvaluation(request: EvaluationRequest): Promise<{
    evaluationId: string;
    conversationHistory: string;
    model: string;
    prompt: string;
  }> {
    const { conversation_id, model } = request;

    // 检查评估条件
    const canEvaluate = await this.canEvaluateConversation(conversation_id);
    if (!canEvaluate) {
      throw new Error('无法进行评估：对话消息数量不足（至少需要3条消息）或没有激活的评估提示词');
    }

    // 获取评估模型
    const evaluationModel = model || await systemSettingsService.getEvaluationDefaultModel();

    // 提取对话历史
    const conversationHistory = await this.extractConversationHistory(conversation_id);

    // 构建评估提示词
    const evaluationPrompt = await promptService.renderPrompt('evaluation', {
      'conversation.history': conversationHistory
    });

    // 预创建评估记录（内容为空，后续流式更新）
    const evaluationId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO conversation_evaluations 
       (id, conversation_id, evaluation_content, model_used, conversation_history, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [evaluationId, conversation_id, '', evaluationModel, conversationHistory, now]
    );

    return {
      evaluationId,
      conversationHistory,
      model: evaluationModel,
      prompt: evaluationPrompt
    };
  }

  /**
   * 更新流式评估的内容
   */
  async updateStreamEvaluation(evaluationId: string, content: string): Promise<void> {
    await db.run(
      'UPDATE conversation_evaluations SET evaluation_content = ? WHERE id = ?',
      [content, evaluationId]
    );
  }

  /**
   * 删除评估记录
   */
  async deleteEvaluation(evaluationId: string): Promise<void> {
    await db.run(
      'DELETE FROM conversation_evaluations WHERE id = ?',
      [evaluationId]
    );
  }

  /**
   * 将数据库行映射为评估对象
   */
  private mapRowToEvaluation(row: ConversationEvaluationRow): ConversationEvaluation {
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

export const evaluationService = new EvaluationService();
