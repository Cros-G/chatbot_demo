"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../database/chatbot.db');
class Database {
    constructor() {
        this.db = new sqlite3_1.default.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            }
            else {
                console.log('📦 Connected to SQLite database');
                this.initializeTables();
            }
        });
    }
    async initializeTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS task_phases (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )`,
            `CREATE TABLE IF NOT EXISTS key_behaviors (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phase_id) REFERENCES task_phases (id) ON DELETE CASCADE
      )`,
            `CREATE TABLE IF NOT EXISTS key_phrases (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL,
        phrase TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phase_id) REFERENCES task_phases (id) ON DELETE CASCADE
      )`,
            `CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        personality TEXT NOT NULL,
        speaking_style TEXT NOT NULL,
        background TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        task_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
      )`,
            `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        task_id TEXT,
        role_id TEXT,
        template_id TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        FOREIGN KEY (role_id) REFERENCES roles (id),
        FOREIGN KEY (template_id) REFERENCES templates (id)
      )`,
            `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )`,
            `CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('system', 'coach', 'evaluation')),
        template TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT true,
        variables TEXT, -- JSON array of variable names
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        memory_window_size INTEGER NOT NULL DEFAULT 10,
        evaluation_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
        ];
        for (const query of queries) {
            await this.run(query);
        }
        await this.run(`
      INSERT OR IGNORE INTO system_settings (id, memory_window_size, evaluation_enabled) 
      VALUES ('default', 10, true)
    `);
    }
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
exports.db = new Database();
//# sourceMappingURL=database.js.map