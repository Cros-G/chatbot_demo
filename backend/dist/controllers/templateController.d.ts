import { Request, Response, NextFunction } from 'express';
declare class TemplateController {
    getAllTemplates(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const templateController: TemplateController;
export {};
//# sourceMappingURL=templateController.d.ts.map