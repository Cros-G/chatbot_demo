import { SystemSettings } from '../types';
declare class SystemSettingsService {
    getSettings(): Promise<SystemSettings>;
    getDefaultModel(): Promise<string>;
    getMemoryWindowSize(): Promise<number>;
    getEvaluationDefaultModel(): Promise<string>;
    isEvaluationEnabled(): Promise<boolean>;
}
export declare const systemSettingsService: SystemSettingsService;
export {};
//# sourceMappingURL=systemSettingsService.d.ts.map