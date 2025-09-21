"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const templateController_1 = require("../controllers/templateController");
const router = express_1.default.Router();
exports.templateRoutes = router;
router.get('/', templateController_1.templateController.getAllTemplates);
router.get('/:id', templateController_1.templateController.getTemplateById);
router.post('/', templateController_1.templateController.createTemplate);
router.put('/:id', templateController_1.templateController.updateTemplate);
router.delete('/:id', templateController_1.templateController.deleteTemplate);
//# sourceMappingURL=templateRoutes.js.map