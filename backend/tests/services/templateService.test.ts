import { templateService } from '../../src/services/templateService';
import { db } from '../../src/models/database';
import { NotFoundError } from '../../src/middleware/errorHandler';

// Mock the database
jest.mock('../../src/models/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('TemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTask = {
    id: 'task-1',
    name: '销售沟通',
    description: '销售技巧训练',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockRole = {
    id: 'role-1',
    name: '销售专家',
    personality: '热情开朗',
    speaking_style: '亲切友好',
    background: '10年销售经验',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockTemplate = {
    id: 'template-1',
    name: '销售训练模板',
    task_id: 'task-1',
    role_id: 'role-1',
    description: '销售技巧训练模板',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  describe('getAllTemplates', () => {
    it('should return all templates with task and role info', async () => {
      mockDb.all.mockResolvedValue([mockTemplate]);
      mockDb.get
        .mockResolvedValueOnce(mockTask)   // 获取task信息
        .mockResolvedValueOnce(mockRole);  // 获取role信息

      const result = await templateService.getAllTemplates();

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM templates ORDER BY created_at DESC');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('销售训练模板');
      expect(result[0]!.task?.name).toBe('销售沟通');
      expect(result[0]!.role?.name).toBe('销售专家');
    });

    it('should return empty array when no templates exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await templateService.getAllTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    it('should return template with task and role info when found', async () => {
      mockDb.get
        .mockResolvedValueOnce(mockTemplate) // 获取template
        .mockResolvedValueOnce(mockTask)     // 获取task信息
        .mockResolvedValueOnce(mockRole);    // 获取role信息

      const result = await templateService.getTemplateById('template-1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM templates WHERE id = ?', ['template-1']);
      expect(result.id).toBe('template-1');
      expect(result.name).toBe('销售训练模板');
      expect(result.task?.name).toBe('销售沟通');
      expect(result.role?.name).toBe('销售专家');
    });

    it('should throw NotFoundError when template not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(templateService.getTemplateById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('createTemplate', () => {
    it('should create template with valid task and role', async () => {
      const templateData = {
        name: '新模板',
        task_id: 'task-1',
        role_id: 'role-1',
        description: '测试模板'
      };

      mockDb.get
        .mockResolvedValueOnce(mockTask)     // 验证task存在
        .mockResolvedValueOnce(mockRole)     // 验证role存在
        .mockResolvedValueOnce(mockTemplate) // 获取创建的template
        .mockResolvedValueOnce(mockTask)     // buildTemplateFromRow中获取task
        .mockResolvedValueOnce(mockRole);    // buildTemplateFromRow中获取role
      
      mockDb.run.mockResolvedValue();

      const result = await templateService.createTemplate(templateData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO templates (id, name, task_id, role_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        expect.arrayContaining([
          expect.any(String), // UUID
          templateData.name,
          templateData.task_id,
          templateData.role_id,
          templateData.description,
          expect.any(String), // timestamp
          expect.any(String)  // timestamp
        ])
      );
      expect(result.name).toBe('销售训练模板');
    });

    it('should throw NotFoundError when task does not exist', async () => {
      const templateData = {
        name: '新模板',
        task_id: 'nonexistent-task',
        role_id: 'role-1'
      };

      mockDb.get.mockResolvedValue(undefined); // task不存在

      await expect(templateService.createTemplate(templateData))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      const templateData = {
        name: '新模板',
        task_id: 'task-1',
        role_id: 'nonexistent-role'
      };

      mockDb.get
        .mockResolvedValueOnce(mockTask)     // task存在
        .mockResolvedValueOnce(undefined);   // role不存在

      await expect(templateService.createTemplate(templateData))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateTemplate', () => {
    it('should update existing template', async () => {
      const templateData = {
        name: '更新模板',
        task_id: 'task-1',
        role_id: 'role-1',
        description: '更新描述'
      };

      const updatedTemplate = {
        ...mockTemplate,
        name: '更新模板',
        description: '更新描述'
      };

      mockDb.get
        .mockResolvedValueOnce(mockTemplate)    // 检查template存在
        .mockResolvedValueOnce(mockTask)        // 验证task存在
        .mockResolvedValueOnce(mockRole)        // 验证role存在
        .mockResolvedValueOnce(updatedTemplate) // 获取更新后的template
        .mockResolvedValueOnce(mockTask)        // buildTemplateFromRow中获取task
        .mockResolvedValueOnce(mockRole);       // buildTemplateFromRow中获取role
      
      mockDb.run.mockResolvedValue();

      const result = await templateService.updateTemplate('template-1', templateData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE templates SET name = ?, task_id = ?, role_id = ?, description = ?, updated_at = ? WHERE id = ?',
        [templateData.name, templateData.task_id, templateData.role_id, templateData.description, expect.any(String), 'template-1']
      );
      expect(result.name).toBe('更新模板'); // 应该返回更新后的name
    });

    it('should throw NotFoundError when template does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const templateData = {
        name: '模板',
        task_id: 'task-1',
        role_id: 'role-1'
      };

      await expect(templateService.updateTemplate('nonexistent', templateData))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete existing template', async () => {
      mockDb.get.mockResolvedValue(mockTemplate);
      mockDb.run.mockResolvedValue();

      await templateService.deleteTemplate('template-1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM templates WHERE id = ?', ['template-1']);
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM templates WHERE id = ?', ['template-1']);
    });

    it('should throw NotFoundError when template does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(templateService.deleteTemplate('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
