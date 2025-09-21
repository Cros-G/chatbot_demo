"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableRoutes = void 0;
const express_1 = __importDefault(require("express"));
const variableController_1 = require("../controllers/variableController");
const router = express_1.default.Router();
exports.variableRoutes = router;
router.get('/', variableController_1.variableController.getAllVariables);
router.get('/sample', variableController_1.variableController.getSampleVariables);
router.get('/category/:category', variableController_1.variableController.getVariablesByCategory);
router.get('/:id', variableController_1.variableController.getVariableById);
router.put('/:id', variableController_1.variableController.updateVariable);
//# sourceMappingURL=variableRoutes.js.map