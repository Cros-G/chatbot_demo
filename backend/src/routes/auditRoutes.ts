import { Router } from 'express';
import { auditController } from '../controllers/auditController';

const router = Router();

// 获取所有审计日志
router.get('/', auditController.getAllAuditLogs);

// 获取解析失败的日志
router.get('/failed', auditController.getFailedParsingLogs);

// 根据对话ID获取审计日志
router.get('/conversation/:conversationId', auditController.getAuditLogsByConversation);

// 清理旧日志
router.delete('/cleanup', auditController.cleanupOldLogs);

export default router;

