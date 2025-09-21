import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { 
  Template, 
  TemplateCreateRequest, 
  TemplateRow,
  TaskRow,
  RoleRow
} from '../types';
import { NotFoundError } from '../middleware/errorHandler';

class TemplateService {
  async getAllTemplates(): Promise<Template[]> {
    const templateRows = await db.all<TemplateRow>('SELECT * FROM templates ORDER BY created_at DESC');
    
    const templates: Template[] = [];
    for (const templateRow of templateRows) {
      const template = await this.buildTemplateFromRow(templateRow);
      templates.push(template);
    }
    
    return templates;
  }

  async getTemplateById(id: string): Promise<Template> {
    const templateRow = await db.get<TemplateRow>('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!templateRow) {
      throw new NotFoundError('模板不存在', { templateId: id });
    }
    
    return this.buildTemplateFromRow(templateRow);
  }

  async createTemplate(templateData: TemplateCreateRequest): Promise<Template> {
    // 验证任务和角色是否存在
    const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [templateData.task_id]);
    if (!task) {
      throw new NotFoundError('指定的任务不存在', { taskId: templateData.task_id });
    }

    const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [templateData.role_id]);
    if (!role) {
      throw new NotFoundError('指定的角色不存在', { roleId: templateData.role_id });
    }

    const templateId = uuidv4();
    const now = new Date().toISOString();
    
    await db.run(
      'INSERT INTO templates (id, name, task_id, role_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [templateId, templateData.name, templateData.task_id, templateData.role_id, templateData.description || null, now, now]
    );
    
    return this.getTemplateById(templateId);
  }

  async updateTemplate(id: string, templateData: TemplateCreateRequest): Promise<Template> {
    // 检查模板是否存在
    const existingTemplate = await db.get<TemplateRow>('SELECT * FROM templates WHERE id = ?', [id]);
    if (!existingTemplate) {
      throw new NotFoundError('模板不存在', { templateId: id });
    }

    // 验证任务和角色是否存在
    const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [templateData.task_id]);
    if (!task) {
      throw new NotFoundError('指定的任务不存在', { taskId: templateData.task_id });
    }

    const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [templateData.role_id]);
    if (!role) {
      throw new NotFoundError('指定的角色不存在', { roleId: templateData.role_id });
    }
    
    const now = new Date().toISOString();
    
    await db.run(
      'UPDATE templates SET name = ?, task_id = ?, role_id = ?, description = ?, updated_at = ? WHERE id = ?',
      [templateData.name, templateData.task_id, templateData.role_id, templateData.description || null, now, id]
    );
    
    return this.getTemplateById(id);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await db.get<TemplateRow>('SELECT * FROM templates WHERE id = ?', [id]);
    if (!template) {
      throw new NotFoundError('模板不存在', { templateId: id });
    }
    
    await db.run('DELETE FROM templates WHERE id = ?', [id]);
  }

  private async buildTemplateFromRow(templateRow: TemplateRow): Promise<Template> {
    // 获取关联的任务信息
    const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [templateRow.task_id]);
    
    // 获取关联的角色信息
    const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [templateRow.role_id]);

    const template: Template = {
      id: templateRow.id,
      name: templateRow.name,
      task_id: templateRow.task_id,
      role_id: templateRow.role_id,
      created_at: new Date(templateRow.created_at),
      updated_at: new Date(templateRow.updated_at)
    };

    if (templateRow.description) {
      template.description = templateRow.description;
    }

    // 添加关联信息用于显示
    if (task) {
      const taskInfo: any = {
        id: task.id,
        name: task.name,
        phases: [], // 模板列表不需要详细的phases信息
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at)
      };
      
      if (task.description) {
        taskInfo.description = task.description;
      }
      
      template.task = taskInfo;
    }

    if (role) {
      template.role = {
        id: role.id,
        name: role.name,
        personality: role.personality,
        speaking_style: role.speaking_style,
        background: role.background,
        created_at: new Date(role.created_at),
        updated_at: new Date(role.updated_at)
      };
    }

    return template;
  }
}

export const templateService = new TemplateService();
