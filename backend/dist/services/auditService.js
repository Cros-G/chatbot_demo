"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
class AuditService {
    async logAIInteraction(data) {
        const id = (0, uuid_1.v4)();
        await database_1.db.run(`INSERT INTO ai_audit_logs (
        id, conversation_id, user_message_id, ai_message_id,
        system_prompt, user_input, ai_raw_output, ai_parsed_output,
        model_used, is_parsing_successful, parsing_error, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
        return id;
    }
    async getAllAuditLogs() {
        const rows = await database_1.db.all(`SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 100`);
        return rows.map(this.mapRowToAuditLog);
    }
    async getAuditLogsByConversation(conversationId) {
        const rows = await database_1.db.all(`SELECT * FROM ai_audit_logs WHERE conversation_id = ? ORDER BY created_at DESC`, [conversationId]);
        return rows.map(this.mapRowToAuditLog);
    }
    async getFailedParsingLogs() {
        const rows = await database_1.db.all(`SELECT * FROM ai_audit_logs WHERE is_parsing_successful = 0 ORDER BY created_at DESC LIMIT 50`);
        return rows.map(this.mapRowToAuditLog);
    }
    async cleanupOldLogs() {
        await database_1.db.run(`
      DELETE FROM ai_audit_logs 
      WHERE id NOT IN (
        SELECT id FROM ai_audit_logs 
        ORDER BY created_at DESC 
        LIMIT 1000
      )
    `);
    }
    mapRowToAuditLog(row) {
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
exports.auditService = new AuditService();
//# sourceMappingURL=auditService.js.map