import { Request, Response, NextFunction } from 'express';
declare class TaskController {
    getAllTasks(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getTaskById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTask(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateTask(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteTask(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const taskController: TaskController;
export {};
//# sourceMappingURL=taskController.d.ts.map