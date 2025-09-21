"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskController = void 0;
const taskService_1 = require("../services/taskService");
const errorHandler_1 = require("../middleware/errorHandler");
class TaskController {
    async getAllTasks(_req, res, next) {
        try {
            const tasks = await taskService_1.taskService.getAllTasks();
            res.json({ data: tasks });
        }
        catch (error) {
            next(error);
        }
    }
    async getTaskById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('任务ID不能为空');
            }
            const task = await taskService_1.taskService.getTaskById(id);
            res.json({ data: task });
        }
        catch (error) {
            next(error);
        }
    }
    async createTask(req, res, next) {
        try {
            const taskData = req.body;
            if (!taskData.name || !taskData.phases || taskData.phases.length === 0) {
                throw new errorHandler_1.ValidationError('任务名称和阶段信息不能为空');
            }
            const task = await taskService_1.taskService.createTask(taskData);
            res.status(201).json({
                data: task,
                message: '任务创建成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTask(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('任务ID不能为空');
            }
            const taskData = req.body;
            const task = await taskService_1.taskService.updateTask(id, taskData);
            res.json({
                data: task,
                message: '任务更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTask(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('任务ID不能为空');
            }
            await taskService_1.taskService.deleteTask(id);
            res.json({ message: '任务删除成功' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.taskController = new TaskController();
//# sourceMappingURL=taskController.js.map