import { roleService } from '../../src/services/roleService';
import { db } from '../../src/models/database';
import { NotFoundError } from '../../src/middleware/errorHandler';

// Mock the database
jest.mock('../../src/models/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles ordered by created_at DESC', async () => {
      const mockRoles = [
        {
          id: '1',
          name: '销售专家',
          personality: '热情开朗',
          speaking_style: '亲切友好',
          background: '10年销售经验',
          created_at: '2024-01-02',
          updated_at: '2024-01-02'
        },
        {
          id: '2', 
          name: '客服代表',
          personality: '耐心细致',
          speaking_style: '专业礼貌',
          background: '客服行业5年经验',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      mockDb.all.mockResolvedValue(mockRoles);

      const result = await roleService.getAllRoles();

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM roles ORDER BY created_at DESC');
      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('销售专家');
      expect(result[0]!.created_at).toBeInstanceOf(Date);
    });

    it('should return empty array when no roles exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await roleService.getAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      const mockRole = {
        id: '1',
        name: '销售专家',
        personality: '热情开朗',
        speaking_style: '亲切友好',
        background: '10年销售经验',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      mockDb.get.mockResolvedValue(mockRole);

      const result = await roleService.getRoleById('1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM roles WHERE id = ?', ['1']);
      expect(result.id).toBe('1');
      expect(result.name).toBe('销售专家');
    });

    it('should throw NotFoundError when role not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(roleService.getRoleById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('createRole', () => {
    it('should create role with valid data', async () => {
      const roleData = {
        name: '新角色',
        personality: '专业严谨',
        speaking_style: '正式礼貌',
        background: '专业背景'
      };

      const mockCreatedRole = {
        id: 'new-id',
        ...roleData,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      mockDb.run.mockResolvedValue();
      mockDb.get.mockResolvedValue(mockCreatedRole);

      const result = await roleService.createRole(roleData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO roles (id, name, personality, speaking_style, background, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        expect.arrayContaining([
          expect.any(String), // UUID
          roleData.name,
          roleData.personality,
          roleData.speaking_style,
          roleData.background,
          expect.any(String), // timestamp
          expect.any(String)  // timestamp
        ])
      );
      expect(result.name).toBe(roleData.name);
    });
  });

  describe('updateRole', () => {
    it('should update existing role', async () => {
      const roleData = {
        name: '更新角色',
        personality: '更新性格',
        speaking_style: '更新风格',
        background: '更新背景'
      };

      const existingRole = {
        id: '1',
        name: '原角色',
        personality: '原性格',
        speaking_style: '原风格',
        background: '原背景',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const updatedRole = {
        ...existingRole,
        ...roleData,
        updated_at: '2024-01-02'
      };

      mockDb.get
        .mockResolvedValueOnce(existingRole)  // 检查存在
        .mockResolvedValueOnce(updatedRole);  // 返回更新后的角色
      mockDb.run.mockResolvedValue();

      const result = await roleService.updateRole('1', roleData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE roles SET name = ?, personality = ?, speaking_style = ?, background = ?, updated_at = ? WHERE id = ?',
        [roleData.name, roleData.personality, roleData.speaking_style, roleData.background, expect.any(String), '1']
      );
      expect(result.name).toBe(roleData.name);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const roleData = {
        name: '角色',
        personality: '性格',
        speaking_style: '风格',
        background: '背景'
      };

      await expect(roleService.updateRole('nonexistent', roleData))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('deleteRole', () => {
    it('should delete existing role', async () => {
      const existingRole = {
        id: '1',
        name: '角色',
        personality: '性格',
        speaking_style: '风格',
        background: '背景',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      mockDb.get.mockResolvedValue(existingRole);
      mockDb.run.mockResolvedValue();

      await roleService.deleteRole('1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM roles WHERE id = ?', ['1']);
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM roles WHERE id = ?', ['1']);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(roleService.deleteRole('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
