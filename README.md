# AI陪练对话网站

一个基于React + Node.js的AI陪练对话平台，支持任务管理、角色设定、模板配置和实时AI对话功能。

## 项目结构

```
chatbot-demo/
├── backend/           # Node.js + Express 后端
├── frontend/          # React + TypeScript 前端
├── specs/            # 需求规格文档
├── steering/         # 项目约定和规范
├── tests/            # 集成测试
└── shared/           # 前后端共享代码
```

## 技术栈

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **AI集成**: OpenAI GPT API
- **其他**: CORS, Helmet, Joi验证

### 前端
- **框架**: React + TypeScript
- **UI库**: Ant Design
- **路由**: React Router
- **HTTP客户端**: Axios
- **国际化**: 中文本地化

## 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8

### 1. 安装依赖

```bash
# 安装项目依赖
npm run setup

# 或者分别安装
npm run setup:backend
npm run setup:frontend
```

### 2. 环境配置

确保根目录下的 `env` 文件包含以下配置：

```bash
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# 后端配置
PORT=3001
NODE_ENV=development

# 前端配置
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### 3. 启动项目

```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run dev:backend   # 后端: http://localhost:3001
npm run dev:frontend  # 前端: http://localhost:3000
```

### 4. 访问应用

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

## 功能模块

### 1. 设置页 (/settings)
- **任务管理**: 创建、编辑、删除任务，支持多阶段配置
- **角色管理**: 管理AI陪练角色的性格、风格和背景
- **模板管理**: 组合任务和角色创建快速模板

### 2. 练习页 (/practice)
- **对话创建**: 选择任务、角色或模板开始对话
- **对话历史**: 查看和管理历史对话记录
- **实时对话**: 与AI陪练进行实时交互

### 3. 后台页 (/admin)
- **提示词管理**: 管理系统提示词模板和版本
- **系统设置**: 配置AI记忆窗口和评估开关

## API接口

### 任务管理
- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/:id` - 获取单个任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 角色管理
- `GET /api/roles` - 获取所有角色
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 对话管理
- `GET /api/conversations` - 获取对话列表
- `POST /api/conversations` - 创建对话
- `POST /api/conversations/:id/messages` - 发送消息

## 开发指南

### 代码规范
- 遵循TypeScript严格模式
- 使用ESLint和Prettier进行代码格式化
- 组件使用函数式组件 + Hooks
- API错误统一处理

### 数据库设计
- 支持任务的多阶段配置
- 角色信息包含性格、风格、背景
- 对话历史完整记录
- 提示词版本管理

### 测试
```bash
npm run test          # 运行所有测试
npm run test:backend  # 后端测试
npm run test:frontend # 前端测试
```

### 构建部署
```bash
npm run build         # 构建所有项目
npm run build:backend # 构建后端
npm run build:frontend# 构建前端
```

## 项目状态

当前版本: **v1.0.0-alpha**

### 已完成
- ✅ 项目架构搭建
- ✅ 数据库设计和初始化
- ✅ 后端API框架
- ✅ 前端界面框架
- ✅ 任务管理基础功能

### 进行中
- 🚧 任务管理完整实现
- 🚧 角色管理功能
- 🚧 模板管理功能

### 待开发
- ⏳ 对话功能实现
- ⏳ OpenAI API集成
- ⏳ 提示词管理
- ⏳ 系统设置
- ⏳ 用户体验优化

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 发送邮件
- 微信群讨论
