# 数据模型设计

## 核心实体

### Task (任务)
```typescript
interface Task {
  id: string;
  name: string;
  description?: string;
  phases: TaskPhase[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskPhase {
  id: string;
  name: string;
  order: number;
  keyBehaviors: KeyBehavior[];
  keyPhrases: string[];
}

interface KeyBehavior {
  id: string;
  description: string;
  type: 'positive' | 'negative';
}
```

### Role (角色)
```typescript
interface Role {
  id: string;
  name: string;
  personality: string;        // 性格特点
  speakingStyle: string;      // 说话风格  
  background: string;         // 背景信息
  createdAt: Date;
  updatedAt: Date;
}
```

### Template (模板)
```typescript
interface Template {
  id: string;
  name: string;
  taskId: string;
  roleId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversation (对话)
```typescript
interface Conversation {
  id: string;
  name: string;
  taskId?: string;
  roleId?: string;
  templateId?: string;
  messages: Message[];
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### Prompt (提示词)
```typescript
interface Prompt {
  id: string;
  name: string;
  category: 'system' | 'coach' | 'evaluation';
  template: string;           // 支持变量占位符
  version: number;
  isActive: boolean;
  variables: string[];        // 可引用的变量列表
  createdAt: Date;
  updatedAt: Date;
}
```

### SystemSettings (系统设置)
```typescript
interface SystemSettings {
  id: string;
  memoryWindowSize: number;   // AI记忆窗口大小
  evaluationEnabled: boolean; // 是否启用评估
  updatedAt: Date;
}
```
