# 项目约定

## 目录结构约定

```
chatbot-demo/
├── backend/                 # Node.js后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   └── utils/           # 工具函数
│   ├── database/            # 数据库文件和迁移
│   └── tests/               # 后端测试
├── frontend/                # React前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义hooks
│   │   ├── services/        # API调用
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   └── public/              # 静态资源
├── specs/                   # 需求规格文档
├── tests/                   # 集成测试
├── steering/                # 项目级约定
└── shared/                  # 前后端共享代码
```

## 命名约定

### 文件命名
- 组件文件: `PascalCase.tsx` (TaskList.tsx)
- 工具文件: `camelCase.ts` (apiClient.ts)
- 常量文件: `UPPER_SNAKE_CASE.ts` (API_ENDPOINTS.ts)
- 类型文件: `camelCase.types.ts` (task.types.ts)

### 变量命名
- 变量和函数: `camelCase`
- 常量: `UPPER_SNAKE_CASE`
- 类和接口: `PascalCase`
- 组件props: `PascalCase` + Props后缀

### API端点命名
```
GET    /api/tasks           # 获取任务列表
POST   /api/tasks           # 创建任务
GET    /api/tasks/:id       # 获取单个任务
PUT    /api/tasks/:id       # 更新任务
DELETE /api/tasks/:id       # 删除任务
```

## 数据库约定

### 表命名
- 使用复数形式: `tasks`, `roles`, `conversations`
- 关联表: `task_phases`, `conversation_messages`

### 字段命名
- 使用snake_case: `created_at`, `updated_at`
- ID字段: `id` (主键), `task_id` (外键)
- 布尔字段: `is_active`, `is_deleted`

## 错误处理约定

### HTTP状态码
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

### 错误响应格式
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "指定的任务不存在",
    "details": {
      "taskId": "123"
    }
  }
}
```

## 环境变量约定

```bash
# 数据库
DATABASE_URL=sqlite:./database/chatbot.db

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# 服务器
PORT=3001
NODE_ENV=development

# 前端
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## Git约定

### 分支命名
- 功能分支: `feature/task-management`
- 修复分支: `fix/conversation-loading`
- 重构分支: `refactor/role-components`

### 提交信息
使用约定式提交(Conventional Commits):
- `feat:` 新功能
- `fix:` 错误修复
- `refactor:` 重构
- `docs:` 文档更新
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 测试约定

### 测试文件命名
- 单元测试: `*.test.ts` 或 `*.spec.ts`
- 集成测试: `*.integration.test.ts`
- E2E测试: `*.e2e.test.ts`

### 测试结构
```typescript
describe('TaskService', () => {
  describe('createTask', () => {
    it('should create task with valid data', () => {
      // 测试逻辑
    });
    
    it('should throw error with invalid data', () => {
      // 测试逻辑
    });
  });
});
```
