import { Request, Response, NextFunction } from 'express';
declare class ConversationController {
    getAllConversations(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getConversationById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendMessageWithAI(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const conversationController: ConversationController;
export {};
//# sourceMappingURL=conversationController.d.ts.map