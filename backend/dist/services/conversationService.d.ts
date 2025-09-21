import { Conversation, ConversationCreateRequest, MessageCreateRequest, Message } from '../types';
declare class ConversationService {
    getAllConversations(): Promise<Conversation[]>;
    getConversationById(id: string): Promise<Conversation>;
    createConversation(conversationData: ConversationCreateRequest): Promise<Conversation>;
    updateConversation(id: string, updateData: Partial<ConversationCreateRequest>): Promise<Conversation>;
    deleteConversation(id: string): Promise<void>;
    sendMessage(conversationId: string, messageData: MessageCreateRequest): Promise<Message>;
    sendMessageWithAIReply(conversationId: string, userMessage: string, model?: string): Promise<{
        userMessage: Message;
        aiMessage: Message;
    }>;
    private buildConversationFromRow;
    private buildMessageFromRow;
    private getCurrentPsychologicalState;
    private generateAIResponseWithRetry;
    private sendMessageWithState;
    private saveConversationState;
    private buildSystemPromptWithState;
    private buildSystemPromptForState;
}
export declare const conversationService: ConversationService;
export {};
//# sourceMappingURL=conversationService.d.ts.map