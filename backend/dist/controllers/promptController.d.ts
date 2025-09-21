import { Request, Response, NextFunction } from 'express';
declare class PromptController {
    getAllPrompts(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getPromptById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createPrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
    updatePrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
    deletePrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
    activatePrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
    previewPrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPromptVersions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVersionStats(_req: Request, res: Response, next: NextFunction): Promise<void>;
    migrateCoachToSystem(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getCurrentSystemPrompt(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const promptController: PromptController;
export {};
//# sourceMappingURL=promptController.d.ts.map