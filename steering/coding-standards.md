# 编码规范 - Linus Style

## 核心原则

> "Talk is cheap. Show me the code." - Linus Torvalds

### 1. 简洁性至上
- 代码应该是自解释的，注释是失败的标志
- 如果你需要注释来解释代码在做什么，那代码写得不够好
- 函数应该做一件事，并且做好

### 2. 性能优先
- 不要过早优化，但也不要写明显愚蠢的代码
- 数据库查询要高效，避免N+1问题
- 前端状态管理要精准，避免不必要的重渲染

### 3. 错误处理
- 错误处理不是可选的，是必须的
- 失败要快速失败，不要隐藏错误
- 用户友好的错误信息，开发者友好的错误日志

## TypeScript规范

### 接口定义
```typescript
// Good - 清晰的接口定义
interface TaskCreateRequest {
  name: string;
  description?: string;
  phases: TaskPhaseInput[];
}

// Bad - 模糊的类型
interface TaskData {
  [key: string]: any;
}
```

### 函数命名
```typescript
// Good - 动词开头，明确意图
function createTask(data: TaskCreateRequest): Promise<Task>
function validateTaskPhases(phases: TaskPhase[]): boolean
function deleteTaskById(id: string): Promise<void>

// Bad - 名词或模糊的动词
function taskCreation(data: any): any
function handleTask(data: any): any
```

### 错误处理
```typescript
// Good - 明确的错误类型
class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task with id ${id} not found`);
    this.name = 'TaskNotFoundError';
  }
}

// Bad - 通用错误
throw new Error('Something went wrong');
```

## React组件规范

### 组件结构
```typescript
// Good - 清晰的组件结构
interface TaskListProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onTaskDelete: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskSelect, 
  onTaskDelete 
}) => {
  // 组件逻辑
};
```

### 状态管理
- 状态应该尽可能接近使用它的组件
- 全局状态只用于真正需要共享的数据
- 使用useCallback和useMemo来避免不必要的重渲染

## 文件组织

```
src/
├── components/          # 可复用组件
├── pages/              # 页面组件
├── hooks/              # 自定义hooks
├── services/           # API调用和业务逻辑
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
└── constants/          # 常量定义
```

## 提交信息规范

```
feat: 添加任务创建功能
fix: 修复对话历史加载问题
refactor: 重构角色管理组件
docs: 更新API文档
test: 添加任务验证测试
```

## 代码审查原则

1. **功能性**: 代码是否按预期工作？
2. **可读性**: 代码是否易于理解？
3. **可维护性**: 代码是否易于修改？
4. **性能**: 是否有明显的性能问题？
5. **安全性**: 是否有安全漏洞？

记住：**"Good code is its own best documentation."**
