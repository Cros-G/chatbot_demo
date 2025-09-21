import { Request, Response, NextFunction } from 'express';
declare class RoleController {
    getAllRoles(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getRoleById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteRole(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const roleController: RoleController;
export {};
//# sourceMappingURL=roleController.d.ts.map