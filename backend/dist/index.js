"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const promptService_1 = require("./services/promptService");
const variableService_1 = require("./services/variableService");
const taskRoutes_1 = require("./routes/taskRoutes");
const roleRoutes_1 = require("./routes/roleRoutes");
const templateRoutes_1 = require("./routes/templateRoutes");
const conversationRoutes_1 = require("./routes/conversationRoutes");
const promptRoutes_1 = require("./routes/promptRoutes");
const variableRoutes_1 = require("./routes/variableRoutes");
const settingsRoutes_1 = require("./routes/settingsRoutes");
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const evaluationRoutes_1 = require("./routes/evaluationRoutes");
dotenv_1.default.config({ path: '../env' });
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(requestLogger_1.requestLogger);
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/tasks', taskRoutes_1.taskRoutes);
app.use('/api/roles', roleRoutes_1.roleRoutes);
app.use('/api/templates', templateRoutes_1.templateRoutes);
app.use('/api/conversations', conversationRoutes_1.conversationRoutes);
app.use('/api/prompts', promptRoutes_1.promptRoutes);
app.use('/api/variables', variableRoutes_1.variableRoutes);
app.use('/api/settings', settingsRoutes_1.settingsRoutes);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/evaluations', evaluationRoutes_1.evaluationRoutes);
app.use(errorHandler_1.errorHandler);
app.use('*', (_req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: '请求的资源不存在'
        }
    });
});
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    try {
        await promptService_1.promptService.initializeDefaultPrompts();
        console.log(`✅ Default prompts initialized`);
        await variableService_1.variableService.initializeDefaultVariables();
        console.log(`✅ Default variables initialized`);
    }
    catch (error) {
        console.error('❌ Failed to initialize defaults:', error);
    }
});
//# sourceMappingURL=index.js.map