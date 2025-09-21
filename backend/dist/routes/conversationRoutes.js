"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const conversationController_1 = require("../controllers/conversationController");
const router = express_1.default.Router();
exports.conversationRoutes = router;
router.get('/', conversationController_1.conversationController.getAllConversations);
router.get('/:id', conversationController_1.conversationController.getConversationById);
router.post('/', conversationController_1.conversationController.createConversation);
router.put('/:id', conversationController_1.conversationController.updateConversation);
router.delete('/:id', conversationController_1.conversationController.deleteConversation);
router.post('/:id/messages', conversationController_1.conversationController.sendMessage);
router.post('/:id/chat', conversationController_1.conversationController.sendMessageWithAI);
//# sourceMappingURL=conversationRoutes.js.map