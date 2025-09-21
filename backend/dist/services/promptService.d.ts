import { Task, Role } from '../types';
export interface Prompt {
    id: string;
    name: string;
    category: 'system' | 'coach' | 'evaluation';
    template: string;
    version: number;
    is_active: boolean;
    variables: string[];
    created_at: Date;
    updated_at: Date;
}
export interface PromptCreateRequest {
    name: string;
    category: 'system' | 'coach' | 'evaluation';
    template: string;
    variables?: string[];
}
declare class PromptService {
    getAllPrompts(): Promise<Prompt[]>;
    getPromptById(id: string): Promise<Prompt>;
    getActivePromptByCategory(category: 'system' | 'coach' | 'evaluation'): Promise<Prompt | null>;
    createPrompt(promptData: PromptCreateRequest): Promise<Prompt>;
    updatePrompt(id: string, promptData: Partial<PromptCreateRequest>): Promise<Prompt>;
    deletePrompt(id: string): Promise<void>;
    activatePrompt(id: string): Promise<Prompt>;
    getPromptVersions(name: string): Promise<Prompt[]>;
    getVersionStats(): Promise<Array<{
        name: string;
        category: string;
        versions: number;
        active_version: number;
    }>>;
    migrateCoachToSystem(): Promise<void>;
    renderPrompt(category: 'system' | 'coach' | 'evaluation', variables: Record<string, any>): Promise<string>;
    buildSystemPrompt(task: Task | undefined, role: Role | undefined): Promise<string>;
    private replaceVariables;
    private formatTaskPhases;
    private mapRowToPrompt;
    initializeDefaultPrompts(): Promise<void>;
}
export declare const promptService: PromptService;
export {};
//# sourceMappingURL=promptService.d.ts.map