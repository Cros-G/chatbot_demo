import { ParsedAIResponse } from '../types';
export declare class AIResponseParser {
    parseResponse(aiResponse: string): ParsedAIResponse;
    private extractProgressStatus;
    private extractKeyPointsUpdate;
    private extractResponse;
    private extractJsonFromContent;
}
export declare const aiResponseParser: AIResponseParser;
//# sourceMappingURL=aiResponseParser.d.ts.map