import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { Task, Role } from '../types';
import { NotFoundError } from '../middleware/errorHandler';

export interface Prompt {
  id: string;
  name: string;
  category: 'system' | 'coach' | 'evaluation';
  template: string;
  version: number;
  is_active: boolean;
  variables: string[];
  created_at: Date;
  updated_at: Date;
}

export interface PromptCreateRequest {
  name: string;
  category: 'system' | 'coach' | 'evaluation';
  template: string;
  variables?: string[];
}

interface PromptRow {
  id: string;
  name: string;
  category: string;
  template: string;
  version: number;
  is_active: number;
  variables: string | null;
  created_at: string;
  updated_at: string;
}

class PromptService {
  async getAllPrompts(): Promise<Prompt[]> {
    const rows = await db.all<PromptRow>(
      'SELECT * FROM prompts ORDER BY category, name'
    );
    
    return rows.map(this.mapRowToPrompt);
  }

  async getPromptById(id: string): Promise<Prompt> {
    const row = await db.get<PromptRow>(
      'SELECT * FROM prompts WHERE id = ?',
      [id]
    );
    
    if (!row) {
      throw new NotFoundError('提示词不存在', { promptId: id });
    }
    
    return this.mapRowToPrompt(row);
  }

  async getActivePromptByCategory(category: 'system' | 'coach' | 'evaluation'): Promise<Prompt | null> {
    const row = await db.get<PromptRow>(
      'SELECT * FROM prompts WHERE category = ? AND is_active = 1 ORDER BY version DESC LIMIT 1',
      [category]
    );
    
    return row ? this.mapRowToPrompt(row) : null;
  }

  async createPrompt(promptData: PromptCreateRequest): Promise<Prompt> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const variables = JSON.stringify(promptData.variables || []);
    
    // 先将同类别的其他提示词设为非激活状态
    await db.run(
      'UPDATE prompts SET is_active = 0 WHERE category = ?',
      [promptData.category]
    );
    
    // 创建新提示词，设为激活状态
    await db.run(
      `INSERT INTO prompts (id, name, category, template, version, is_active, variables, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)`,
      [id, promptData.name, promptData.category, promptData.template, variables, now, now]
    );
    
    return this.getPromptById(id);
  }

  async updatePrompt(id: string, promptData: Partial<PromptCreateRequest>): Promise<Prompt> {
    await this.getPromptById(id); // 验证提示词存在
    const now = new Date().toISOString();
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (promptData.name) {
      updates.push('name = ?');
      values.push(promptData.name);
    }
    
    if (promptData.template) {
      updates.push('template = ?', 'version = version + 1');
      values.push(promptData.template);
    }
    
    if (promptData.variables) {
      updates.push('variables = ?');
      values.push(JSON.stringify(promptData.variables));
    }
    
    updates.push('updated_at = ?');
    values.push(now, id);
    
    await db.run(
      `UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getPromptById(id);
  }

  async deletePrompt(id: string): Promise<void> {
    await this.getPromptById(id); // 验证提示词存在
    
    await db.run('DELETE FROM prompts WHERE id = ?', [id]);
  }

  async activatePrompt(id: string): Promise<Prompt> {
    const prompt = await this.getPromptById(id);
    
    // 先将同类别的其他提示词设为非激活状态
    await db.run(
      'UPDATE prompts SET is_active = 0 WHERE category = ? AND id != ?',
      [prompt.category, id]
    );
    
    // 激活当前提示词
    await db.run(
      'UPDATE prompts SET is_active = 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
    
    return this.getPromptById(id);
  }

  /**
   * 获取提示词的版本历史（按名称分组）
   */
  async getPromptVersions(name: string): Promise<Prompt[]> {
    const rows = await db.all<PromptRow>(
      'SELECT * FROM prompts WHERE name = ? ORDER BY version DESC',
      [name]
    );
    
    return rows.map(this.mapRowToPrompt);
  }

  /**
   * 获取所有提示词的版本统计
   */
  async getVersionStats(): Promise<Array<{name: string, category: string, versions: number, active_version: number}>> {
    const rows = await db.all<{name: string, category: string, versions: number, active_version: number}>(
      `SELECT 
         name, 
         category,
         COUNT(*) as versions,
         MAX(CASE WHEN is_active = 1 THEN version END) as active_version
       FROM prompts 
       GROUP BY name, category
       ORDER BY category, name`
    );
    
    return rows;
  }

  /**
   * 迁移所有coach类别的提示词到system类别
   */
  async migrateCoachToSystem(): Promise<void> {
    // 先将所有system类别的提示词设为非激活
    await db.run('UPDATE prompts SET is_active = 0 WHERE category = ?', ['system']);
    
    // 将所有coach类别的提示词迁移到system类别
    await db.run(
      'UPDATE prompts SET category = ?, updated_at = ? WHERE category = ?',
      ['system', new Date().toISOString(), 'coach']
    );
  }

  /**
   * 渲染提示词模板，替换变量
   */
  async renderPrompt(category: 'system' | 'coach' | 'evaluation', variables: Record<string, any>): Promise<string> {
    const prompt = await this.getActivePromptByCategory(category);
    if (!prompt) {
      throw new NotFoundError(`没有找到激活的${category}类型提示词`);
    }
    
    return this.replaceVariables(prompt.template, variables);
  }

  /**
   * 构建完整的系统提示词（用于替换原有的硬编码逻辑）
   */
  async buildSystemPrompt(task: Task | undefined, role: Role | undefined): Promise<string> {
    const systemPrompt = await this.getActivePromptByCategory('system');
    
    if (!systemPrompt) {
      throw new Error('系统提示词未配置');
    }
    
    // 准备变量
    const variables: Record<string, any> = {
      'role.name': role?.name || '',
      'role.personality': role?.personality || '',
      'role.speaking_style': role?.speaking_style || '',
      'role.background': role?.background || '',
      'task.name': task?.name || '',
      'task.description': task?.description || '',
      'task.phases': this.formatTaskPhases(task)
    };
    
    // 直接返回系统提示词，不再拼接coach提示词
    return this.replaceVariables(systemPrompt.template, variables);
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // 替换 ${variable} 格式的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    }
    
    return result;
  }

  private formatTaskPhases(task: Task | undefined): string {
    if (!task || !task.phases || task.phases.length === 0) {
      return '';
    }
    
    let phases = '\n## 训练要点\n';
    task.phases.forEach((phase, index) => {
      phases += `\n### 阶段${index + 1}：${phase.name}\n`;
      
      if (phase.key_behaviors && phase.key_behaviors.length > 0) {
        phases += `关键行为：\n`;
        phase.key_behaviors.forEach(behavior => {
          const prefix = behavior.type === 'positive' ? '✓' : '✗';
          phases += `${prefix} ${behavior.description}\n`;
        });
      }
      
      if (phase.key_phrases && phase.key_phrases.length > 0) {
        phases += `关键话术：\n`;
        phase.key_phrases.forEach(phrase => {
          phases += `• ${phrase}\n`;
        });
      }
    });
    
    return phases;
  }

  private mapRowToPrompt(row: PromptRow): Prompt {
    return {
      id: row.id,
      name: row.name,
      category: row.category as 'system' | 'coach' | 'evaluation',
      template: row.template,
      version: row.version,
      is_active: Boolean(row.is_active),
      variables: row.variables ? JSON.parse(row.variables) : [],
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  /**
   * 初始化默认提示词（用于系统首次启动）
   */
  async initializeDefaultPrompts(): Promise<void> {
    const existingPrompts = await this.getAllPrompts();
    if (existingPrompts.length > 0) {
      return; // 已有提示词，不需要初始化
    }

    // 创建默认的系统提示词
    await this.createPrompt({
      name: '基础系统提示词',
      category: 'system',
      template: `你是一个专业的AI陪练助手。

## 角色设定
你现在扮演：\${role.name}
性格特点：\${role.personality}
说话风格：\${role.speaking_style}
背景信息：\${role.background}
请严格按照这个角色的特点来回复，保持角色的一致性。

## 训练任务
当前训练任务：\${task.name}
任务描述：\${task.description}
\${task.phases}

请围绕这个训练任务进行对话，帮助用户练习和提升相关技能。`,
      variables: ['role.name', 'role.personality', 'role.speaking_style', 'role.background', 'task.name', 'task.description', 'task.phases']
    });

    // 创建默认的陪练提示词
    await this.createPrompt({
      name: '基础陪练指导',
      category: 'coach',
      template: `## 对话原则
1. 保持专业和友好的态度
2. 根据用户的回复给出建设性的反馈
3. 适时提供指导和建议
4. 保持对话的自然流畅
5. 鼓励用户积极参与练习`,
      variables: []
    });

    // 创建默认的评估提示词
    await this.createPrompt({
      name: '对话评估分析',
      category: 'evaluation',
      template: `你是一个专业的对话评估专家。请对以下对话进行全面分析和评估。

## 对话记录
\${conversation.history}

## 评估要求
请从以下几个维度对此次对话进行评估：

### 1. 沟通效果评估
- 学员的表达是否清晰、准确
- 是否达到了预期的沟通目标
- 整体对话流畅度如何

### 2. 技能运用分析
- 学员运用了哪些有效的沟通技巧
- 哪些关键技能还需要加强
- 在关键节点的处理是否得当

### 3. 改进建议
- 具体的改进点和建议
- 下一步练习的重点方向
- 可以参考的优化策略

### 4. 亮点总结
- 对话中表现优秀的地方
- 值得保持和发扬的优点

请提供详细、具体、可操作的评估意见，帮助学员更好地提升沟通技能。`,
      variables: ['conversation.history']
    });
  }
}

export const promptService = new PromptService();
