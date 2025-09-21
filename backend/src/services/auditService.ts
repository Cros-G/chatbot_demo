import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { AIAuditLog, AIAuditLogRow } from '../types';

class AuditService {
  /**
   * 记录AI交互审计日志
   */
  async logAIInteraction(data: {
    conversationId?: string | undefined;
    userMessageId?: string | undefined;
    aiMessageId?: string | undefined;
    systemPrompt: string;
    userInput: string;
    aiRawOutput: string;
    aiParsedOutput?: string | undefined;
    modelUsed: string;
    isParsingSuccessful: boolean;
    parsingError?: string | undefined;
    retryCount?: number;
  }): Promise<string> {
    const id = uuidv4();
    
    await db.run(
      `INSERT INTO ai_audit_logs (
        id, conversation_id, user_message_id, ai_message_id,
        system_prompt, user_input, ai_raw_output, ai_parsed_output,
        model_used, is_parsing_successful, parsing_error, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.conversationId || null,
        data.userMessageId || null,
        data.aiMessageId || null,
        data.systemPrompt,
        data.userInput,
        data.aiRawOutput,
        data.aiParsedOutput || null,
        data.modelUsed,
        data.isParsingSuccessful ? 1 : 0,
        data.parsingError || null,
        data.retryCount || 0
      ]
    );

    return id;
  }

  /**
   * 获取所有审计日志
   */
  async getAllAuditLogs(): Promise<AIAuditLog[]> {
    const rows = await db.all<AIAuditLogRow>(
      `SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 100`
    );

    return rows.map(this.mapRowToAuditLog);
  }

  /**
   * 根据对话ID获取审计日志
   */
  async getAuditLogsByConversation(conversationId: string): Promise<AIAuditLog[]> {
    const rows = await db.all<AIAuditLogRow>(
      `SELECT * FROM ai_audit_logs WHERE conversation_id = ? ORDER BY created_at DESC`,
      [conversationId]
    );

    return rows.map(this.mapRowToAuditLog);
  }

  /**
   * 获取解析失败的审计日志
   */
  async getFailedParsingLogs(): Promise<AIAuditLog[]> {
    const rows = await db.all<AIAuditLogRow>(
      `SELECT * FROM ai_audit_logs WHERE is_parsing_successful = 0 ORDER BY created_at DESC LIMIT 50`
    );

    return rows.map(this.mapRowToAuditLog);
  }

  /**
   * 清理旧的审计日志（保留最近1000条）
   */
  async cleanupOldLogs(): Promise<void> {
    await db.run(`
      DELETE FROM ai_audit_logs 
      WHERE id NOT IN (
        SELECT id FROM ai_audit_logs 
        ORDER BY created_at DESC 
        LIMIT 1000
      )
    `);
  }

  /**
   * 将数据库行映射为审计日志对象
   */
  private mapRowToAuditLog(row: AIAuditLogRow): AIAuditLog {
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      user_message_id: row.user_message_id,
      ai_message_id: row.ai_message_id,
      system_prompt: row.system_prompt,
      user_input: row.user_input,
      ai_raw_output: row.ai_raw_output,
      ai_parsed_output: row.ai_parsed_output,
      model_used: row.model_used,
      is_parsing_successful: row.is_parsing_successful === 1,
      parsing_error: row.parsing_error,
      retry_count: row.retry_count,
      created_at: new Date(row.created_at)
    };
  }
}

export const auditService = new AuditService();
