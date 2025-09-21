"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = void 0;
const roleService_1 = require("../services/roleService");
const errorHandler_1 = require("../middleware/errorHandler");
class RoleController {
    async getAllRoles(_req, res, next) {
        try {
            const roles = await roleService_1.roleService.getAllRoles();
            res.json({ data: roles });
        }
        catch (error) {
            next(error);
        }
    }
    async getRoleById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('角色ID不能为空');
            }
            const role = await roleService_1.roleService.getRoleById(id);
            res.json({ data: role });
        }
        catch (error) {
            next(error);
        }
    }
    async createRole(req, res, next) {
        try {
            const roleData = req.body;
            if (!roleData.name || !roleData.personality || !roleData.speaking_style || !roleData.background) {
                throw new errorHandler_1.ValidationError('角色名称、性格特点、说话风格和背景信息不能为空');
            }
            const role = await roleService_1.roleService.createRole(roleData);
            res.status(201).json({
                data: role,
                message: '角色创建成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateRole(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('角色ID不能为空');
            }
            const roleData = req.body;
            const role = await roleService_1.roleService.updateRole(id, roleData);
            res.json({
                data: role,
                message: '角色更新成功'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteRole(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('角色ID不能为空');
            }
            await roleService_1.roleService.deleteRole(id);
            res.json({ message: '角色删除成功' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.roleController = new RoleController();
//# sourceMappingURL=roleController.js.map