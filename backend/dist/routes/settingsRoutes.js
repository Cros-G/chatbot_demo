"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../models/database");
const router = express_1.default.Router();
exports.settingsRoutes = router;
router.get('/', async (_req, res) => {
    try {
        const row = await database_1.db.get('SELECT * FROM system_settings WHERE id = ?', ['default']);
        if (!row) {
            return res.status(404).json({ message: '系统设置不存在' });
        }
        const settings = {
            id: row.id,
            memory_window_size: row.memory_window_size,
            evaluation_enabled: Boolean(row.evaluation_enabled),
            default_model: row.default_model,
            evaluation_default_model: row.evaluation_default_model,
            updated_at: new Date(row.updated_at)
        };
        return res.json({ data: settings, message: '获取系统设置成功' });
    }
    catch (error) {
        console.error('获取系统设置失败:', error);
        return res.status(500).json({ message: '获取系统设置失败' });
    }
});
router.put('/', async (req, res) => {
    try {
        const updates = req.body;
        const updateFields = [];
        const values = [];
        if (updates.memory_window_size !== undefined) {
            updateFields.push('memory_window_size = ?');
            values.push(updates.memory_window_size);
        }
        if (updates.evaluation_enabled !== undefined) {
            updateFields.push('evaluation_enabled = ?');
            values.push(updates.evaluation_enabled ? 1 : 0);
        }
        if (updates.default_model !== undefined) {
            updateFields.push('default_model = ?');
            values.push(updates.default_model);
        }
        if (updates.evaluation_default_model !== undefined) {
            updateFields.push('evaluation_default_model = ?');
            values.push(updates.evaluation_default_model);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ message: '没有需要更新的字段' });
        }
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        values.push('default');
        const sql = `UPDATE system_settings SET ${updateFields.join(', ')} WHERE id = ?`;
        await database_1.db.run(sql, values);
        const row = await database_1.db.get('SELECT * FROM system_settings WHERE id = ?', ['default']);
        const settings = {
            id: row.id,
            memory_window_size: row.memory_window_size,
            evaluation_enabled: Boolean(row.evaluation_enabled),
            default_model: row.default_model,
            evaluation_default_model: row.evaluation_default_model,
            updated_at: new Date(row.updated_at)
        };
        return res.json({ data: settings, message: '更新系统设置成功' });
    }
    catch (error) {
        console.error('更新系统设置失败:', error);
        return res.status(500).json({ message: '更新系统设置失败' });
    }
});
//# sourceMappingURL=settingsRoutes.js.map