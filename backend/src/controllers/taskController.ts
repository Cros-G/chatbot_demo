import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { TaskCreateRequest } from '../types';
import { ValidationError } from '../middleware/errorHandler';

class TaskController {
  async getAllTasks(_req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getAllTasks();
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('任务ID不能为空');
      }
      const task = await taskService.getTaskById(id);
      res.json({ data: task });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskData: TaskCreateRequest = req.body;
      
      // Basic validation
      if (!taskData.name || !taskData.phases || taskData.phases.length === 0) {
        throw new ValidationError('任务名称和阶段信息不能为空');
      }

      const task = await taskService.createTask(taskData);
      res.status(201).json({ 
        data: task, 
        message: '任务创建成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('任务ID不能为空');
      }
      const taskData: TaskCreateRequest = req.body;
      
      const task = await taskService.updateTask(id, taskData);
      res.json({ 
        data: task, 
        message: '任务更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('任务ID不能为空');
      }
      await taskService.deleteTask(id);
      res.json({ message: '任务删除成功' });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
