import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services/templateService';
import { TemplateCreateRequest } from '../types';
import { ValidationError } from '../middleware/errorHandler';

class TemplateController {
  async getAllTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await templateService.getAllTemplates();
      res.json({ data: templates });
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('模板ID不能为空');
      }
      const template = await templateService.getTemplateById(id);
      res.json({ data: template });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const templateData: TemplateCreateRequest = req.body;
      
      // Basic validation
      if (!templateData.name || !templateData.task_id || !templateData.role_id) {
        throw new ValidationError('模板名称、任务ID和角色ID不能为空');
      }

      const template = await templateService.createTemplate(templateData);
      res.status(201).json({ 
        data: template, 
        message: '模板创建成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('模板ID不能为空');
      }
      const templateData: TemplateCreateRequest = req.body;
      
      const template = await templateService.updateTemplate(id, templateData);
      res.json({ 
        data: template, 
        message: '模板更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('模板ID不能为空');
      }
      await templateService.deleteTemplate(id);
      res.json({ message: '模板删除成功' });
    } catch (error) {
      next(error);
    }
  }
}

export const templateController = new TemplateController();
