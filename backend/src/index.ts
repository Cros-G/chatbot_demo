import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { promptService } from './services/promptService';
import { variableService } from './services/variableService';
import { taskRoutes } from './routes/taskRoutes';
import { roleRoutes } from './routes/roleRoutes';
import { templateRoutes } from './routes/templateRoutes';
import { conversationRoutes } from './routes/conversationRoutes';
import { promptRoutes } from './routes/promptRoutes';
import { variableRoutes } from './routes/variableRoutes';
import { settingsRoutes } from './routes/settingsRoutes';
import auditRoutes from './routes/auditRoutes';
import { evaluationRoutes } from './routes/evaluationRoutes';

// Load environment variables
dotenv.config({ path: '../env' });

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/variables', variableRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
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
  
  // 初始化默认提示词和变量配置
  try {
    await promptService.initializeDefaultPrompts();
    console.log(`✅ Default prompts initialized`);
    
    await variableService.initializeDefaultVariables();
    console.log(`✅ Default variables initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize defaults:', error);
  }
});
