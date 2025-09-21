import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversationService';
import { ConversationCreateRequest, MessageCreateRequest } from '../types';
import { ValidationError } from '../middleware/errorHandler';

class ConversationController {
  async getAllConversations(_req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await conversationService.getAllConversations();
      res.json({ data: conversations });
    } catch (error) {
      next(error);
    }
  }

  async getConversationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('对话ID不能为空');
      }
      const conversation = await conversationService.getConversationById(id);
      res.json({ data: conversation });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationData: ConversationCreateRequest = req.body;
      
      // Basic validation
      if (!conversationData.name) {
        throw new ValidationError('对话名称不能为空');
      }

      // 验证创建方式：必须提供 (task_id + role_id) 或 template_id
      const hasTaskAndRole = conversationData.task_id && conversationData.role_id;
      const hasTemplate = conversationData.template_id;
      
      if (!hasTaskAndRole && !hasTemplate) {
        throw new ValidationError('请选择任务和角色，或选择模板');
      }

      const conversation = await conversationService.createConversation(conversationData);
      res.status(201).json({ 
        data: conversation, 
        message: '对话创建成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('对话ID不能为空');
      }
      
      const updateData = req.body;
      const conversation = await conversationService.updateConversation(id, updateData);
      res.json({ 
        data: conversation, 
        message: '对话更新成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('对话ID不能为空');
      }
      await conversationService.deleteConversation(id);
      res.json({ message: '对话删除成功' });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('对话ID不能为空');
      }
      
      const messageData: MessageCreateRequest = req.body;
      if (!messageData.content || !messageData.role) {
        throw new ValidationError('消息内容和角色不能为空');
      }

      const message = await conversationService.sendMessage(id, messageData);
      res.status(201).json({ 
        data: message, 
        message: '消息发送成功' 
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessageWithAI(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('对话ID不能为空');
      }
      
      const { content, model } = req.body;
      if (!content) {
        throw new ValidationError('消息内容不能为空');
      }

      const result = await conversationService.sendMessageWithAIReply(id, content, model);
      res.status(201).json({ 
        data: result, 
        message: 'AI对话成功' 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationController = new ConversationController();
