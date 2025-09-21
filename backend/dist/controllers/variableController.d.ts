import { Request, Response, NextFunction } from 'express';
declare class VariableController {
    getAllVariables(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getVariableById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateVariable(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVariablesByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSampleVariables(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const variableController: VariableController;
export {};
//# sourceMappingURL=variableController.d.ts.map