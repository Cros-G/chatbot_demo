"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRoutes = void 0;
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const router = express_1.default.Router();
exports.taskRoutes = router;
router.get('/', taskController_1.taskController.getAllTasks);
router.get('/:id', taskController_1.taskController.getTaskById);
router.post('/', taskController_1.taskController.createTask);
router.put('/:id', taskController_1.taskController.updateTask);
router.delete('/:id', taskController_1.taskController.deleteTask);
//# sourceMappingURL=taskRoutes.js.map