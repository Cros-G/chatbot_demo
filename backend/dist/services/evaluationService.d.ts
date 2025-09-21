import { ConversationEvaluation, EvaluationRequest } from '../types';
declare class EvaluationService {
    getEvaluationsByConversation(conversationId: string): Promise<ConversationEvaluation[]>;
    extractConversationHistory(conversationId: string): Promise<string>;
    canEvaluateConversation(conversationId: string): Promise<boolean>;
    createEvaluation(request: EvaluationRequest): Promise<ConversationEvaluation>;
    streamEvaluation(request: EvaluationRequest): Promise<{
        evaluationId: string;
        conversationHistory: string;
        model: string;
        prompt: string;
    }>;
    updateStreamEvaluation(evaluationId: string, content: string): Promise<void>;
    deleteEvaluation(evaluationId: string): Promise<void>;
    private mapRowToEvaluation;
}
export declare const evaluationService: EvaluationService;
export {};
//# sourceMappingURL=evaluationService.d.ts.map