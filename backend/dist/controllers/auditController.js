"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const auditService_1 = require("../services/auditService");
class AuditController {
    async getAllAuditLogs(_req, res) {
        try {
            const logs = await auditService_1.auditService.getAllAuditLogs();
            res.json({
                data: logs,
                message: '获取审计日志成功'
            });
        }
        catch (error) {
            console.error('获取审计日志失败:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '获取审计日志失败'
                }
            });
        }
    }
    async getFailedParsingLogs(_req, res) {
        try {
            const logs = await auditService_1.auditService.getFailedParsingLogs();
            res.json({
                data: logs,
                message: '获取解析失败日志成功'
            });
        }
        catch (error) {
            console.error('获取解析失败日志失败:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '获取解析失败日志失败'
                }
            });
        }
    }
    async getAuditLogsByConversation(req, res) {
        try {
            const { conversationId } = req.params;
            if (!conversationId) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_INPUT',
                        message: '对话ID不能为空'
                    }
                });
                return;
            }
            const logs = await auditService_1.auditService.getAuditLogsByConversation(conversationId);
            res.json({
                data: logs,
                message: '获取对话审计日志成功'
            });
        }
        catch (error) {
            console.error('获取对话审计日志失败:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '获取对话审计日志失败'
                }
            });
        }
    }
    async cleanupOldLogs(_req, res) {
        try {
            await auditService_1.auditService.cleanupOldLogs();
            res.json({
                message: '清理旧日志成功'
            });
        }
        catch (error) {
            console.error('清理旧日志失败:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '清理旧日志失败'
                }
            });
        }
    }
}
exports.auditController = new AuditController();
//# sourceMappingURL=auditController.js.map