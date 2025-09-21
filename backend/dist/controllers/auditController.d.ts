import { Request, Response } from 'express';
declare class AuditController {
    getAllAuditLogs(_req: Request, res: Response): Promise<void>;
    getFailedParsingLogs(_req: Request, res: Response): Promise<void>;
    getAuditLogsByConversation(req: Request, res: Response): Promise<void>;
    cleanupOldLogs(_req: Request, res: Response): Promise<void>;
}
export declare const auditController: AuditController;
export {};
//# sourceMappingURL=auditController.d.ts.map