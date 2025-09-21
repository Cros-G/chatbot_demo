import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/roleService';
import { RoleCreateRequest } from '../types';
import { ValidationError } from '../middleware/errorHandler';

class RoleController {
  async getAllRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.getAllRoles();
      res.json({ data: roles });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('角色ID不能为空');
      }
      const role = await roleService.getRoleById(id);
      res.json({ data: role });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const roleData: RoleCreateRequest = req.body;
      
      // Basic validation
      if (!roleData.name || !roleData.personality || !roleData.speaking_style || !roleData.background) {
        throw new ValidationError('角色名称、性格特点、说话风格和背景信息不能为空');
      }

      const role = await roleService.createRole(roleData);
      res.status(201).json({ 
        data: role, 
        message: '角色创建成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('角色ID不能为空');
      }
      const roleData: RoleCreateRequest = req.body;
      
      const role = await roleService.updateRole(id, roleData);
      res.json({ 
        data: role, 
        message: '角色更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('角色ID不能为空');
      }
      await roleService.deleteRole(id);
      res.json({ message: '角色删除成功' });
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
