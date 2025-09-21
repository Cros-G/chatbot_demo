export interface VariableConfig {
    id: string;
    variable_name: string;
    sample_value: string;
    description: string;
    category: 'role' | 'task' | 'system';
    created_at: Date;
    updated_at: Date;
}
declare class VariableService {
    getAllVariables(): Promise<VariableConfig[]>;
    getVariableById(id: string): Promise<VariableConfig>;
    updateVariable(id: string, data: Partial<{
        sample_value: string;
        description: string;
    }>): Promise<VariableConfig>;
    getSampleVariables(): Promise<Record<string, string>>;
    getVariablesByCategory(category: 'role' | 'task' | 'system' | 'evaluation'): Promise<VariableConfig[]>;
    initializeDefaultVariables(): Promise<void>;
    private mapRowToVariable;
}
export declare const variableService: VariableService;
export {};
//# sourceMappingURL=variableService.d.ts.map