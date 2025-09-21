import { PsychologicalState, ProgressStatus, KeyPointsUpdate } from '../types';
export declare class PsychologicalStateManager {
    initializeFromPrompt(systemPrompt: string): PsychologicalState;
    updateKeyPoints(currentState: PsychologicalState, update: KeyPointsUpdate): PsychologicalState;
    updateProgressStatus(currentState: PsychologicalState, progress: ProgressStatus): PsychologicalState;
    generateStateText(state: PsychologicalState): string;
    private parseRawJsonContent;
    private appendSummary;
}
export declare const psychologicalStateManager: PsychologicalStateManager;
//# sourceMappingURL=psychologicalStateManager.d.ts.map