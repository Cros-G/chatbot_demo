"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableController = void 0;
const variableService_1 = require("../services/variableService");
const errorHandler_1 = require("../middleware/errorHandler");
class VariableController {
    async getAllVariables(_req, res, next) {
        try {
            const variables = await variableService_1.variableService.getAllVariables();
            res.json({ data: variables });
        }
        catch (error) {
            next(error);
        }
    }
    async getVariableById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('变量ID不能为空');
            }
            const variable = await variableService_1.variableService.getVariableById(id);
            res.json({ data: variable });
        }
        catch (error) {
            next(error);
        }
    }
    async updateVariable(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('变量ID不能为空');
            }
            const { sample_value, description } = req.body;
            const variable = await variableService_1.variableService.updateVariable(id, { sample_value, description });
            res.json({
                data: variable,
                message: '变量更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getVariablesByCategory(req, res, next) {
        try {
            const { category } = req.params;
            if (!category || !['role', 'task', 'system'].includes(category)) {
                throw new errorHandler_1.ValidationError('分类必须是 role、task 或 system');
            }
            const variables = await variableService_1.variableService.getVariablesByCategory(category);
            res.json({ data: variables });
        }
        catch (error) {
            next(error);
        }
    }
    async getSampleVariables(_req, res, next) {
        try {
            const variables = await variableService_1.variableService.getSampleVariables();
            res.json({ data: variables });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.variableController = new VariableController();
//# sourceMappingURL=variableController.js.map