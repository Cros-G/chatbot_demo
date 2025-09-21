"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
class RoleService {
    async getAllRoles() {
        const roleRows = await database_1.db.all('SELECT * FROM roles ORDER BY created_at DESC');
        return roleRows.map(this.buildRoleFromRow);
    }
    async getRoleById(id) {
        const roleRow = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [id]);
        if (!roleRow) {
            throw new errorHandler_1.NotFoundError('角色不存在', { roleId: id });
        }
        return this.buildRoleFromRow(roleRow);
    }
    async createRole(roleData) {
        const roleId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run('INSERT INTO roles (id, name, personality, speaking_style, background, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [roleId, roleData.name, roleData.personality, roleData.speaking_style, roleData.background, now, now]);
        return this.getRoleById(roleId);
    }
    async updateRole(id, roleData) {
        const existingRole = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [id]);
        if (!existingRole) {
            throw new errorHandler_1.NotFoundError('角色不存在', { roleId: id });
        }
        const now = new Date().toISOString();
        await database_1.db.run('UPDATE roles SET name = ?, personality = ?, speaking_style = ?, background = ?, updated_at = ? WHERE id = ?', [roleData.name, roleData.personality, roleData.speaking_style, roleData.background, now, id]);
        return this.getRoleById(id);
    }
    async deleteRole(id) {
        const role = await database_1.db.get('SELECT * FROM roles WHERE id = ?', [id]);
        if (!role) {
            throw new errorHandler_1.NotFoundError('角色不存在', { roleId: id });
        }
        await database_1.db.run('DELETE FROM roles WHERE id = ?', [id]);
    }
    buildRoleFromRow(roleRow) {
        return {
            id: roleRow.id,
            name: roleRow.name,
            personality: roleRow.personality,
            speaking_style: roleRow.speaking_style,
            background: roleRow.background,
            created_at: new Date(roleRow.created_at),
            updated_at: new Date(roleRow.updated_at)
        };
    }
}
exports.roleService = new RoleService();
//# sourceMappingURL=roleService.js.map