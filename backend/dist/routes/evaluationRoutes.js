"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const evaluationService_1 = require("../services/evaluationService");
const openaiService_1 = require("../services/openaiService");
const router = express_1.default.Router();
exports.evaluationRoutes = router;
router.get('/conversation/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const evaluations = await evaluationService_1.evaluationService.getEvaluationsByConversation(conversationId);
        return res.json({
            data: evaluations,
            message: '获取评估记录成功'
        });
    }
    catch (error) {
        console.error('获取评估记录失败:', error);
        return res.status(500).json({
            message: '获取评估记录失败'
        });
    }
});
router.get('/conversation/:conversationId/can-evaluate', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const canEvaluate = await evaluationService_1.evaluationService.canEvaluateConversation(conversationId);
        return res.json({
            data: { canEvaluate },
            message: canEvaluate ? '可以进行评估' : '消息数量不足，需要至少3条消息'
        });
    }
    catch (error) {
        console.error('检查评估条件失败:', error);
        return res.status(500).json({
            message: '检查评估条件失败'
        });
    }
});
router.post('/create', async (req, res) => {
    try {
        const request = req.body;
        const evaluation = await evaluationService_1.evaluationService.createEvaluation(request);
        return res.status(201).json({
            data: evaluation,
            message: '评估创建成功'
        });
    }
    catch (error) {
        console.error('创建评估失败:', error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : '创建评估失败'
        });
    }
});
router.post('/stream', async (req, res) => {
    try {
        const request = req.body;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
        const evaluationData = await evaluationService_1.evaluationService.streamEvaluation(request);
        res.write(`data: ${JSON.stringify({
            type: 'start',
            data: {
                evaluationId: evaluationData.evaluationId,
                model: evaluationData.model
            }
        })}\n\n`);
        const client = openaiService_1.openaiService.getClient(evaluationData.model);
        const stream = await client.chat.completions.create({
            model: evaluationData.model,
            messages: [
                { role: 'system', content: evaluationData.prompt }
            ],
            stream: true,
            temperature: 0.3
        });
        let fullContent = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({
                    type: 'content',
                    data: { content }
                })}\n\n`);
            }
        }
        await evaluationService_1.evaluationService.updateStreamEvaluation(evaluationData.evaluationId, fullContent);
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            data: {
                evaluationId: evaluationData.evaluationId,
                fullContent
            }
        })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('流式评估失败:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            data: {
                message: error instanceof Error ? error.message : '流式评估失败'
            }
        })}\n\n`);
        res.end();
    }
});
router.delete('/:evaluationId', async (req, res) => {
    try {
        const { evaluationId } = req.params;
        await evaluationService_1.evaluationService.deleteEvaluation(evaluationId);
        return res.json({
            message: '评估记录删除成功'
        });
    }
    catch (error) {
        console.error('删除评估记录失败:', error);
        return res.status(500).json({
            message: '删除评估记录失败'
        });
    }
});
//# sourceMappingURL=evaluationRoutes.js.map