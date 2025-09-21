import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare class ValidationError extends Error {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare class NotFoundError extends Error {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare class ConflictError extends Error {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare const errorHandler: (error: AppError, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map