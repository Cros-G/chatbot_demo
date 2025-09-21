import { Request, Response, NextFunction } from 'express';
import { variableService } from '../services/variableService';
import { ValidationError } from '../middleware/errorHandler';

class VariableController {
  async getAllVariables(_req: Request, res: Response, next: NextFunction) {
    try {
      const variables = await variableService.getAllVariables();
      res.json({ data: variables });
    } catch (error) {
      next(error);
    }
  }

  async getVariableById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('变量ID不能为空');
      }
      
      const variable = await variableService.getVariableById(id);
      res.json({ data: variable });
    } catch (error) {
      next(error);
    }
  }

  async updateVariable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('变量ID不能为空');
      }
      
      const { sample_value, description } = req.body;
      const variable = await variableService.updateVariable(id, { sample_value, description });
      
      res.json({ 
        data: variable, 
        message: '变量更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async getVariablesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      if (!category || !['role', 'task', 'system'].includes(category)) {
        throw new ValidationError('分类必须是 role、task 或 system');
      }
      
      const variables = await variableService.getVariablesByCategory(category as 'role' | 'task' | 'system');
      res.json({ data: variables });
    } catch (error) {
      next(error);
    }
  }

  async getSampleVariables(_req: Request, res: Response, next: NextFunction) {
    try {
      const variables = await variableService.getSampleVariables();
      res.json({ data: variables });
    } catch (error) {
      next(error);
    }
  }
}

export const variableController = new VariableController();
