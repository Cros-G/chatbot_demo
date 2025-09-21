// Mock OpenAI before importing the service
const mockCreate = jest.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: mockCreate
    }
  }
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

import { openaiService } from '../../src/services/openaiService';

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTask = {
    id: 'task-1',
    name: '销售沟通技巧',
    description: '提升销售人员与客户的沟通能力',
    phases: [
      {
        id: 'phase-1',
        task_id: 'task-1',
        name: '开场阶段',
        order_index: 1,
        key_behaviors: [
          {
            id: 'behavior-1',
            phase_id: 'phase-1',
            description: '主动问候客户',
            type: 'positive' as const,
            created_at: new Date()
          }
        ],
        key_phrases: ['您好，很高兴为您服务'],
        created_at: new Date()
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockRole = {
    id: 'role-1',
    name: '销售专家',
    personality: '热情开朗，积极主动',
    speaking_style: '亲切友好，专业自信',
    background: '拥有10年销售经验，擅长客户沟通',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      role: 'user' as const,
      content: '你好，我想了解一下你们的产品',
      timestamp: new Date()
    }
  ];

  describe('generateResponse', () => {
    it('should generate response with task and role context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '您好！很高兴为您服务！我是销售专家，很乐意为您介绍我们的产品。请问您对哪类产品比较感兴趣呢？'
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await openaiService.generateResponse(
        mockTask, 
        mockRole, 
        mockMessages, 
        10
      );

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('销售专家')
          },
          {
            role: 'user',
            content: '你好，我想了解一下你们的产品'
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      expect(result).toBe('您好！很高兴为您服务！我是销售专家，很乐意为您介绍我们的产品。请问您对哪类产品比较感兴趣呢？');
    });

    it('should work without task and role', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '您好！我是AI陪练助手，很高兴与您对话。'
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await openaiService.generateResponse(
        undefined, 
        undefined, 
        mockMessages, 
        10
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content: expect.stringContaining('AI陪练助手')
            },
            {
              role: 'user',
              content: '你好，我想了解一下你们的产品'
            }
          ]
        })
      );

      expect(result).toBe('您好！我是AI陪练助手，很高兴与您对话。');
    });

    it('should limit conversation history to memory window size', async () => {
      const longMessageHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `msg-${i}`,
        conversation_id: 'conv-1',
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }));

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response'
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await openaiService.generateResponse(
        undefined, 
        undefined, 
        longMessageHistory, 
        5 // Memory window size
      );

      const callArgs = mockCreate.mock.calls[0]![0];
      const conversationMessages = callArgs.messages.slice(1); // Exclude system message
      
      expect(conversationMessages).toHaveLength(5); // Should only include last 5 messages
      expect(conversationMessages[0]!.content).toBe('Message 10'); // Should start from message 10
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const apiError = new Error('rate limit exceeded');
      apiError.message = 'rate limit exceeded';
      
      mockCreate.mockRejectedValue(apiError);

      await expect(
        openaiService.generateResponse(mockTask, mockRole, mockMessages, 10)
      ).rejects.toThrow('AI服务暂时繁忙，请稍后再试');
    });

    it('should handle insufficient quota error', async () => {
      const quotaError = new Error('insufficient_quota');
      quotaError.message = 'insufficient_quota';
      
      mockCreate.mockRejectedValue(quotaError);

      await expect(
        openaiService.generateResponse(mockTask, mockRole, mockMessages, 10)
      ).rejects.toThrow('AI服务配额不足，请联系管理员');
    });

    it('should handle invalid API key error', async () => {
      const authError = new Error('invalid_api_key');
      authError.message = 'invalid_api_key';
      
      mockCreate.mockRejectedValue(authError);

      await expect(
        openaiService.generateResponse(mockTask, mockRole, mockMessages, 10)
      ).rejects.toThrow('AI服务配置错误，请联系管理员');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await expect(
        openaiService.generateResponse(mockTask, mockRole, mockMessages, 10)
      ).rejects.toThrow('AI服务暂时不可用，请稍后再试');
    });
  });

  describe('healthCheck', () => {
    it('should return true when OpenAI is healthy', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello!'
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await openaiService.healthCheck();

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
    });

    it('should return false when OpenAI is unhealthy', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await openaiService.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when no response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await openaiService.healthCheck();

      expect(result).toBe(false);
    });
  });
});
