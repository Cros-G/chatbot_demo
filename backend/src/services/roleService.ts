import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { 
  Role, 
  RoleCreateRequest, 
  RoleRow
} from '../types';
import { NotFoundError } from '../middleware/errorHandler';

class RoleService {
  async getAllRoles(): Promise<Role[]> {
    const roleRows = await db.all<RoleRow>('SELECT * FROM roles ORDER BY created_at DESC');
    
    return roleRows.map(this.buildRoleFromRow);
  }

  async getRoleById(id: string): Promise<Role> {
    const roleRow = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (!roleRow) {
      throw new NotFoundError('角色不存在', { roleId: id });
    }
    
    return this.buildRoleFromRow(roleRow);
  }

  async createRole(roleData: RoleCreateRequest): Promise<Role> {
    const roleId = uuidv4();
    const now = new Date().toISOString();
    
    await db.run(
      'INSERT INTO roles (id, name, personality, speaking_style, background, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [roleId, roleData.name, roleData.personality, roleData.speaking_style, roleData.background, now, now]
    );
    
    return this.getRoleById(roleId);
  }

  async updateRole(id: string, roleData: RoleCreateRequest): Promise<Role> {
    // 检查角色是否存在
    const existingRole = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);
    if (!existingRole) {
      throw new NotFoundError('角色不存在', { roleId: id });
    }
    
    const now = new Date().toISOString();
    
    await db.run(
      'UPDATE roles SET name = ?, personality = ?, speaking_style = ?, background = ?, updated_at = ? WHERE id = ?',
      [roleData.name, roleData.personality, roleData.speaking_style, roleData.background, now, id]
    );
    
    return this.getRoleById(id);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await db.get<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      throw new NotFoundError('角色不存在', { roleId: id });
    }
    
    await db.run('DELETE FROM roles WHERE id = ?', [id]);
  }

  private buildRoleFromRow(roleRow: RoleRow): Role {
    return {
      id: roleRow.id,
      name: roleRow.name,
      personality: roleRow.personality,
      speaking_style: roleRow.speaking_style,
      background: roleRow.background,
      created_at: new Date(roleRow.created_at),
      updated_at: new Date(roleRow.updated_at)
    };
  }
}

export const roleService = new RoleService();
