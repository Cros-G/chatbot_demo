import express from 'express';
import { evaluationService } from '../services/evaluationService';
import { openaiService } from '../services/openaiService';
import { EvaluationRequest } from '../types';

const router = express.Router();

// 获取对话的评估记录
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const evaluations = await evaluationService.getEvaluationsByConversation(conversationId);
    
    return res.json({ 
      data: evaluations, 
      message: '获取评估记录成功' 
    });
  } catch (error) {
    console.error('获取评估记录失败:', error);
    return res.status(500).json({ 
      message: '获取评估记录失败' 
    });
  }
});

// 检查对话是否可以评估
router.get('/conversation/:conversationId/can-evaluate', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const canEvaluate = await evaluationService.canEvaluateConversation(conversationId);
    
    return res.json({ 
      data: { canEvaluate }, 
      message: canEvaluate ? '可以进行评估' : '消息数量不足，需要至少3条消息' 
    });
  } catch (error) {
    console.error('检查评估条件失败:', error);
    return res.status(500).json({ 
      message: '检查评估条件失败' 
    });
  }
});

// 创建评估（非流式）
router.post('/create', async (req, res) => {
  try {
    const request: EvaluationRequest = req.body;
    const evaluation = await evaluationService.createEvaluation(request);
    
    return res.status(201).json({ 
      data: evaluation, 
      message: '评估创建成功' 
    });
  } catch (error) {
    console.error('创建评估失败:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '创建评估失败' 
    });
  }
});

// 流式评估端点
router.post('/stream', async (req, res) => {
  try {
    const request: EvaluationRequest = req.body;
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // 准备评估数据
    const evaluationData = await evaluationService.streamEvaluation(request);
    
    // 发送开始事件
    res.write(`data: ${JSON.stringify({
      type: 'start',
      data: {
        evaluationId: evaluationData.evaluationId,
        model: evaluationData.model
      }
    })}\n\n`);

    // 获取评估模型的客户端
    const client = (openaiService as any).getClient(evaluationData.model);
    
    // 创建流式请求
    const stream = await client.chat.completions.create({
      model: evaluationData.model,
      messages: [
        { role: 'system', content: evaluationData.prompt }
      ],
      stream: true,
      temperature: 0.3
    });

    let fullContent = '';

    // 处理流式响应
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        
        // 发送内容块
        res.write(`data: ${JSON.stringify({
          type: 'content',
          data: { content }
        })}\n\n`);
      }
    }

    // 更新数据库中的评估内容
    await evaluationService.updateStreamEvaluation(evaluationData.evaluationId, fullContent);

    // 发送完成事件
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: {
        evaluationId: evaluationData.evaluationId,
        fullContent
      }
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('流式评估失败:', error);
    
    // 发送错误事件
    res.write(`data: ${JSON.stringify({
      type: 'error',
      data: { 
        message: error instanceof Error ? error.message : '流式评估失败' 
      }
    })}\n\n`);
    
    res.end();
  }
});

// 删除评估记录
router.delete('/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    await evaluationService.deleteEvaluation(evaluationId);
    
    return res.json({ 
      message: '评估记录删除成功' 
    });
  } catch (error) {
    console.error('删除评估记录失败:', error);
    return res.status(500).json({ 
      message: '删除评估记录失败' 
    });
  }
});

export { router as evaluationRoutes };


