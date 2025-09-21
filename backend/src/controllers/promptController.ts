import { Request, Response, NextFunction } from 'express';
import { promptService, PromptCreateRequest } from '../services/promptService';
import { variableService } from '../services/variableService';
import { taskService } from '../services/taskService';
import { roleService } from '../services/roleService';
import { ValidationError } from '../middleware/errorHandler';

class PromptController {
  async getAllPrompts(_req: Request, res: Response, next: NextFunction) {
    try {
      const prompts = await promptService.getAllPrompts();
      res.json({ data: prompts });
    } catch (error) {
      next(error);
    }
  }

  async getPromptById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('提示词ID不能为空');
      }
      
      const prompt = await promptService.getPromptById(id);
      res.json({ data: prompt });
    } catch (error) {
      next(error);
    }
  }

  async createPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const promptData: PromptCreateRequest = req.body;
      
      // 基本验证
      if (!promptData.name || !promptData.category || !promptData.template) {
        throw new ValidationError('名称、分类和模板内容不能为空');
      }

      if (!['system', 'evaluation'].includes(promptData.category)) {
        throw new ValidationError('分类必须是 system 或 evaluation');
      }

      const prompt = await promptService.createPrompt(promptData);
      res.status(201).json({ 
        data: prompt, 
        message: '提示词创建成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('提示词ID不能为空');
      }
      
      const promptData: Partial<PromptCreateRequest> = req.body;
      const prompt = await promptService.updatePrompt(id, promptData);
      
      res.json({ 
        data: prompt, 
        message: '提示词更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('提示词ID不能为空');
      }
      
      await promptService.deletePrompt(id);
      res.json({ message: '提示词删除成功' });
    } catch (error) {
      next(error);
    }
  }

  async activatePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('提示词ID不能为空');
      }
      
      const prompt = await promptService.activatePrompt(id);
      res.json({ 
        data: prompt, 
        message: '提示词激活成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async previewPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { template, variables } = req.body;
      
      if (!template) {
        throw new ValidationError('模板内容不能为空');
      }
      
      // 从变量配置获取示例变量
      const sampleVariables = await variableService.getSampleVariables();
      
      // 合并用户提供的变量（如果有的话）
      const finalVariables = { ...sampleVariables, ...variables };
      
      // 简单的变量替换预览
      let preview = template;
      for (const [key, value] of Object.entries(finalVariables)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        preview = preview.replace(regex, String(value || ''));
      }
      
      res.json({ 
        data: { 
          preview,
          variables: finalVariables 
        } 
      });
    } catch (error) {
      next(error);
    }
  }

  async getPromptVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;
      if (!name) {
        throw new ValidationError('提示词名称不能为空');
      }
      
      const versions = await promptService.getPromptVersions(decodeURIComponent(name));
      res.json({ data: versions });
    } catch (error) {
      next(error);
    }
  }

  async getVersionStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await promptService.getVersionStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async migrateCoachToSystem(_req: Request, res: Response, next: NextFunction) {
    try {
      await promptService.migrateCoachToSystem();
      res.json({ message: 'Coach提示词已成功迁移到System类别' });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentSystemPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId, roleId } = req.query;
      
      // 获取task和role信息（如果提供了ID）
      let task = undefined;
      let role = undefined;
      
      if (taskId && typeof taskId === 'string') {
        try {
          task = await taskService.getTaskById(taskId);
        } catch (error) {
          console.warn(`无法获取task ${taskId}:`, error);
        }
      }
      
      if (roleId && typeof roleId === 'string') {
        try {
          role = await roleService.getRoleById(roleId);
        } catch (error) {
          console.warn(`无法获取role ${roleId}:`, error);
        }
      }
      
      // 获取当前激活的系统提示词
      const activePrompt = await promptService.getActivePromptByCategory('system');
      
      if (!activePrompt) {
        throw new ValidationError('当前没有激活的系统提示词');
      }
      
      // 构建渲染后的系统提示词
      const systemPrompt = await promptService.buildSystemPrompt(task, role);
      
      res.json({ 
        data: {
          prompt: systemPrompt,
          template: activePrompt.template,
          promptInfo: {
            id: activePrompt.id,
            name: activePrompt.name,
            version: activePrompt.version,
            updated_at: activePrompt.updated_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const promptController = new PromptController();
