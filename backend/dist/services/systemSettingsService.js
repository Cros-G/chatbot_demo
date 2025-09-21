"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingsService = void 0;
const database_1 = require("../models/database");
class SystemSettingsService {
    async getSettings() {
        const row = await database_1.db.get('SELECT * FROM system_settings WHERE id = ?', ['default']);
        if (!row) {
            throw new Error('系统设置不存在');
        }
        return {
            id: row.id,
            memory_window_size: row.memory_window_size,
            evaluation_enabled: Boolean(row.evaluation_enabled),
            default_model: row.default_model,
            evaluation_default_model: row.evaluation_default_model,
            updated_at: new Date(row.updated_at)
        };
    }
    async getDefaultModel() {
        try {
            const settings = await this.getSettings();
            return settings.default_model;
        }
        catch (error) {
            console.warn('获取默认模型失败，使用fallback值:', error);
            return 'gpt-4o';
        }
    }
    async getMemoryWindowSize() {
        try {
            const settings = await this.getSettings();
            return settings.memory_window_size;
        }
        catch (error) {
            console.warn('获取记忆窗口大小失败，使用fallback值:', error);
            return 10;
        }
    }
    async getEvaluationDefaultModel() {
        try {
            const settings = await this.getSettings();
            return settings.evaluation_default_model;
        }
        catch (error) {
            console.warn('获取评估默认模型失败，使用fallback值:', error);
            return 'gpt-4o';
        }
    }
    async isEvaluationEnabled() {
        try {
            const settings = await this.getSettings();
            return settings.evaluation_enabled;
        }
        catch (error) {
            console.warn('获取评估模式设置失败，使用fallback值:', error);
            return true;
        }
    }
}
exports.systemSettingsService = new SystemSettingsService();
//# sourceMappingURL=systemSettingsService.js.map