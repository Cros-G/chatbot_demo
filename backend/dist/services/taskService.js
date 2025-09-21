"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../models/database");
const errorHandler_1 = require("../middleware/errorHandler");
class TaskService {
    async getAllTasks() {
        const taskRows = await database_1.db.all('SELECT * FROM tasks ORDER BY created_at DESC');
        const tasks = [];
        for (const taskRow of taskRows) {
            const task = await this.buildTaskFromRow(taskRow);
            tasks.push(task);
        }
        return tasks;
    }
    async getTaskById(id) {
        const taskRow = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!taskRow) {
            throw new errorHandler_1.NotFoundError('任务不存在', { taskId: id });
        }
        return this.buildTaskFromRow(taskRow);
    }
    async createTask(taskData) {
        const taskId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await database_1.db.run('INSERT INTO tasks (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [taskId, taskData.name, taskData.description || null, now, now]);
        for (const phase of taskData.phases) {
            const phaseId = (0, uuid_1.v4)();
            await database_1.db.run('INSERT INTO task_phases (id, task_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?)', [phaseId, taskId, phase.name, phase.order_index, now]);
            for (const behavior of phase.key_behaviors) {
                const behaviorId = (0, uuid_1.v4)();
                await database_1.db.run('INSERT INTO key_behaviors (id, phase_id, description, type, created_at) VALUES (?, ?, ?, ?, ?)', [behaviorId, phaseId, behavior.description, behavior.type, now]);
            }
            for (const phrase of phase.key_phrases) {
                const phraseId = (0, uuid_1.v4)();
                await database_1.db.run('INSERT INTO key_phrases (id, phase_id, phrase, created_at) VALUES (?, ?, ?, ?)', [phraseId, phaseId, phrase, now]);
            }
        }
        return this.getTaskById(taskId);
    }
    async updateTask(id, taskData) {
        const existingTask = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!existingTask) {
            throw new errorHandler_1.NotFoundError('任务不存在', { taskId: id });
        }
        const now = new Date().toISOString();
        await database_1.db.run('UPDATE tasks SET name = ?, description = ?, updated_at = ? WHERE id = ?', [taskData.name, taskData.description || null, now, id]);
        await database_1.db.run('DELETE FROM key_behaviors WHERE phase_id IN (SELECT id FROM task_phases WHERE task_id = ?)', [id]);
        await database_1.db.run('DELETE FROM key_phrases WHERE phase_id IN (SELECT id FROM task_phases WHERE task_id = ?)', [id]);
        await database_1.db.run('DELETE FROM task_phases WHERE task_id = ?', [id]);
        for (const phase of taskData.phases) {
            const phaseId = (0, uuid_1.v4)();
            await database_1.db.run('INSERT INTO task_phases (id, task_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?)', [phaseId, id, phase.name, phase.order_index, now]);
            for (const behavior of phase.key_behaviors) {
                const behaviorId = (0, uuid_1.v4)();
                await database_1.db.run('INSERT INTO key_behaviors (id, phase_id, description, type, created_at) VALUES (?, ?, ?, ?, ?)', [behaviorId, phaseId, behavior.description, behavior.type, now]);
            }
            for (const phrase of phase.key_phrases) {
                const phraseId = (0, uuid_1.v4)();
                await database_1.db.run('INSERT INTO key_phrases (id, phase_id, phrase, created_at) VALUES (?, ?, ?, ?)', [phraseId, phaseId, phrase, now]);
            }
        }
        return this.getTaskById(id);
    }
    async deleteTask(id) {
        const task = await database_1.db.get('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            throw new errorHandler_1.NotFoundError('任务不存在', { taskId: id });
        }
        await database_1.db.run('DELETE FROM tasks WHERE id = ?', [id]);
    }
    async buildTaskFromRow(taskRow) {
        const phaseRows = await database_1.db.all('SELECT * FROM task_phases WHERE task_id = ? ORDER BY order_index', [taskRow.id]);
        const phases = [];
        for (const phaseRow of phaseRows) {
            const behaviorRows = await database_1.db.all('SELECT * FROM key_behaviors WHERE phase_id = ? ORDER BY created_at', [phaseRow.id]);
            const phraseRows = await database_1.db.all('SELECT * FROM key_phrases WHERE phase_id = ? ORDER BY created_at', [phaseRow.id]);
            const keyBehaviors = behaviorRows.map(row => ({
                id: row.id,
                phase_id: row.phase_id,
                description: row.description,
                type: row.type,
                created_at: new Date(row.created_at)
            }));
            const keyPhrases = phraseRows.map(row => row.phrase);
            phases.push({
                id: phaseRow.id,
                task_id: phaseRow.task_id,
                name: phaseRow.name,
                order_index: phaseRow.order_index,
                key_behaviors: keyBehaviors,
                key_phrases: keyPhrases,
                created_at: new Date(phaseRow.created_at)
            });
        }
        const task = {
            id: taskRow.id,
            name: taskRow.name,
            phases,
            created_at: new Date(taskRow.created_at),
            updated_at: new Date(taskRow.updated_at)
        };
        if (taskRow.description) {
            task.description = taskRow.description;
        }
        return task;
    }
}
exports.taskService = new TaskService();
//# sourceMappingURL=taskService.js.map