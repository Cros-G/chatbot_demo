import { AIAuditLog } from '../types';
declare class AuditService {
    logAIInteraction(data: {
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
    }): Promise<string>;
    getAllAuditLogs(): Promise<AIAuditLog[]>;
    getAuditLogsByConversation(conversationId: string): Promise<AIAuditLog[]>;
    getFailedParsingLogs(): Promise<AIAuditLog[]>;
    cleanupOldLogs(): Promise<void>;
    private mapRowToAuditLog;
}
export declare const auditService: AuditService;
export {};
//# sourceMappingURL=auditService.d.ts.map