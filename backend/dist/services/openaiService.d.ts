import { Task, Role, Message } from '../types';
declare class OpenAIService {
    private openaiClient;
    private aliyunClient?;
    constructor();
    private getClient;
    generateResponse(task: Task | undefined, role: Role | undefined, messages: Message[], memoryWindowSize?: number, model?: string, customSystemPrompt?: string): Promise<string>;
    private buildConversationHistory;
    healthCheck(): Promise<boolean>;
}
export declare const openaiService: OpenAIService;
export {};
//# sourceMappingURL=openaiService.d.ts.map