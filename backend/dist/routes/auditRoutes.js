"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const router = (0, express_1.Router)();
router.get('/', auditController_1.auditController.getAllAuditLogs);
router.get('/failed', auditController_1.auditController.getFailedParsingLogs);
router.get('/conversation/:conversationId', auditController_1.auditController.getAuditLogsByConversation);
router.delete('/cleanup', auditController_1.auditController.cleanupOldLogs);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map