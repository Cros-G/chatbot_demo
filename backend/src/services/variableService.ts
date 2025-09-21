import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { NotFoundError } from '../middleware/errorHandler';

export interface VariableConfig {
  id: string;
  variable_name: string;
  sample_value: string;
  description: string;
  category: 'role' | 'task' | 'system';
  created_at: Date;
  updated_at: Date;
}

interface VariableConfigRow {
  id: string;
  variable_name: string;
  sample_value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

class VariableService {
  async getAllVariables(): Promise<VariableConfig[]> {
    const rows = await db.all<VariableConfigRow>(
      'SELECT * FROM variable_configs ORDER BY category, variable_name'
    );
    
    return rows.map(this.mapRowToVariable);
  }

  async getVariableById(id: string): Promise<VariableConfig> {
    const row = await db.get<VariableConfigRow>(
      'SELECT * FROM variable_configs WHERE id = ?',
      [id]
    );
    
    if (!row) {
      throw new NotFoundError('变量配置不存在', { variableId: id });
    }
    
    return this.mapRowToVariable(row);
  }

  async updateVariable(id: string, data: Partial<{ sample_value: string; description: string }>): Promise<VariableConfig> {
    await this.getVariableById(id); // 验证变量存在
    const now = new Date().toISOString();
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.sample_value !== undefined) {
      updates.push('sample_value = ?');
      values.push(data.sample_value);
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    
    updates.push('updated_at = ?');
    values.push(now, id);
    
    await db.run(
      `UPDATE variable_configs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getVariableById(id);
  }

  /**
   * 获取所有变量的示例值，用于预览
   */
  async getSampleVariables(): Promise<Record<string, string>> {
    const variables = await this.getAllVariables();
    const result: Record<string, string> = {};
    
    for (const variable of variables) {
      result[variable.variable_name] = variable.sample_value;
    }
    
    return result;
  }

  /**
   * 按分类获取变量
   */
  async getVariablesByCategory(category: 'role' | 'task' | 'system' | 'evaluation'): Promise<VariableConfig[]> {
    const rows = await db.all<VariableConfigRow>(
      'SELECT * FROM variable_configs WHERE category = ? ORDER BY variable_name',
      [category]
    );
    
    return rows.map(this.mapRowToVariable);
  }

  /**
   * 初始化默认变量配置
   */
  async initializeDefaultVariables(): Promise<void> {
    const existingVariables = await this.getAllVariables();
    if (existingVariables.length > 0) {
      return; // 已有变量配置，不需要初始化
    }

    const defaultVariables = [
      // Role 相关变量
      {
        variable_name: 'role.name',
        sample_value: '销售专家',
        description: '角色名称，用于AI身份设定',
        category: 'role'
      },
      {
        variable_name: 'role.personality',
        sample_value: '热情开朗，积极主动',
        description: '角色性格特点',
        category: 'role'
      },
      {
        variable_name: 'role.speaking_style',
        sample_value: '亲切友好，专业自信',
        description: '角色说话风格',
        category: 'role'
      },
      {
        variable_name: 'role.background',
        sample_value: '拥有10年销售经验，擅长客户沟通',
        description: '角色背景信息',
        category: 'role'
      },
      
      // Task 相关变量
      {
        variable_name: 'task.name',
        sample_value: '销售沟通技巧',
        description: '训练任务名称',
        category: 'task'
      },
      {
        variable_name: 'task.description',
        sample_value: '提升销售人员与客户的沟通能力',
        description: '任务详细描述',
        category: 'task'
      },
      {
        variable_name: 'task.phases',
        sample_value: '\n## 训练要点\n\n### 阶段1：开场阶段\n关键行为：\n✓ 主动问候客户\n✗ 直接推销产品\n关键话术：\n• 您好，很高兴为您服务',
        description: '任务阶段信息（自动格式化）',
        category: 'task'
      },
      
      // Evaluation 相关变量
      {
        variable_name: 'conversation.history',
        sample_value: '学员: 你好，我想了解这个产品\n陪练角色: 您好！很高兴为您介绍我们的产品...',
        description: '对话历史记录，用于评估分析',
        category: 'evaluation'
      }
    ];

    for (const variable of defaultVariables) {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      await db.run(
        `INSERT INTO variable_configs (id, variable_name, sample_value, description, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, variable.variable_name, variable.sample_value, variable.description, variable.category, now, now]
      );
    }
  }

  private mapRowToVariable(row: VariableConfigRow): VariableConfig {
    return {
      id: row.id,
      variable_name: row.variable_name,
      sample_value: row.sample_value,
      description: row.description || '',
      category: row.category as 'role' | 'task' | 'system',
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}

export const variableService = new VariableService();
