"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRoutes = void 0;
const express_1 = __importDefault(require("express"));
const roleController_1 = require("../controllers/roleController");
const router = express_1.default.Router();
exports.roleRoutes = router;
router.get('/', roleController_1.roleController.getAllRoles);
router.get('/:id', roleController_1.roleController.getRoleById);
router.post('/', roleController_1.roleController.createRole);
router.put('/:id', roleController_1.roleController.updateRole);
router.delete('/:id', roleController_1.roleController.deleteRole);
//# sourceMappingURL=roleRoutes.js.map