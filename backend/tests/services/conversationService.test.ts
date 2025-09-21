import { conversationService } from '../../src/services/conversationService';
import { db } from '../../src/models/database';
import { NotFoundError } from '../../src/middleware/errorHandler';

// Mock the database
jest.mock('../../src/models/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTask = {
    id: 'task-1',
    name: '销售沟通',
    description: '销售技巧训练',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockRole = {
    id: 'role-1',
    name: '销售专家',
    personality: '热情开朗',
    speaking_style: '亲切友好',
    background: '10年销售经验',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockTemplate = {
    id: 'template-1',
    name: '销售训练模板',
    task_id: 'task-1',
    role_id: 'role-1',
    description: '销售训练模板',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockConversation = {
    id: 'conversation-1',
    name: '销售对话练习',
    task_id: 'task-1',
    role_id: 'role-1',
    template_id: null,
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockMessage = {
    id: 'message-1',
    conversation_id: 'conversation-1',
    role: 'user',
    content: '你好',
    timestamp: '2024-01-01'
  };

  describe('getAllConversations', () => {
    it('should return all conversations without messages', async () => {
      mockDb.all.mockResolvedValue([mockConversation]);
      mockDb.get
        .mockResolvedValueOnce(mockTask)   // 获取task信息
        .mockResolvedValueOnce(mockRole);  // 获取role信息

      const result = await conversationService.getAllConversations();

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM conversations ORDER BY updated_at DESC');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('销售对话练习');
      expect(result[0]!.task?.name).toBe('销售沟通');
      expect(result[0]!.role?.name).toBe('销售专家');
      expect(result[0]!.messages).toEqual([]);
    });

    it('should return empty array when no conversations exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await conversationService.getAllConversations();

      expect(result).toEqual([]);
    });
  });

  describe('getConversationById', () => {
    it('should return conversation with messages when found', async () => {
      mockDb.get
        .mockResolvedValueOnce(mockConversation) // 获取conversation
        .mockResolvedValueOnce(mockTask)         // 获取task信息
        .mockResolvedValueOnce(mockRole);        // 获取role信息
      
      mockDb.all.mockResolvedValue([mockMessage]); // 获取messages

      const result = await conversationService.getConversationById('conversation-1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM conversations WHERE id = ?', ['conversation-1']);
      expect(result.id).toBe('conversation-1');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]!.content).toBe('你好');
    });

    it('should throw NotFoundError when conversation not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(conversationService.getConversationById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('createConversation', () => {
    it('should create conversation with task and role', async () => {
      const conversationData = {
        name: '新对话',
        task_id: 'task-1',
        role_id: 'role-1'
      };

      mockDb.get
        .mockResolvedValueOnce(mockTask)         // 验证task存在
        .mockResolvedValueOnce(mockRole)         // 验证role存在
        .mockResolvedValueOnce(mockConversation) // 获取创建的conversation
        .mockResolvedValueOnce(mockTask)         // buildConversationFromRow中获取task
        .mockResolvedValueOnce(mockRole);        // buildConversationFromRow中获取role
      
      mockDb.run.mockResolvedValue();
      mockDb.all.mockResolvedValue([]); // 没有消息

      const result = await conversationService.createConversation(conversationData);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO conversations'),
        expect.arrayContaining([
          expect.any(String), // UUID
          conversationData.name,
          conversationData.task_id,
          conversationData.role_id,
          null, // template_id
          'active',
          expect.any(String), // created_at
          expect.any(String)  // updated_at
        ])
      );
      expect(result.name).toBe('销售对话练习');
    });

    it('should create conversation with template', async () => {
      const conversationData = {
        name: '模板对话',
        template_id: 'template-1'
      };

      mockDb.get
        .mockResolvedValueOnce(mockTemplate)     // 获取template
        .mockResolvedValueOnce(mockTask)         // 验证task存在
        .mockResolvedValueOnce(mockRole)         // 验证role存在
        .mockResolvedValueOnce(mockConversation) // 获取创建的conversation
        .mockResolvedValueOnce(mockTask)         // buildConversationFromRow中获取task
        .mockResolvedValueOnce(mockRole);        // buildConversationFromRow中获取role
      
      mockDb.run.mockResolvedValue();
      mockDb.all.mockResolvedValue([]); // 没有消息

      const result = await conversationService.createConversation(conversationData);

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM templates WHERE id = ?', ['template-1']);
      expect(result.name).toBe('销售对话练习');
    });

    it('should throw NotFoundError when template does not exist', async () => {
      const conversationData = {
        name: '对话',
        template_id: 'nonexistent-template'
      };

      mockDb.get.mockResolvedValue(undefined); // template不存在

      await expect(conversationService.createConversation(conversationData))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateConversation', () => {
    it('should update existing conversation', async () => {
      const updateData = { name: '更新的对话' };

      const updatedConversation = {
        ...mockConversation,
        name: '更新的对话'
      };

      mockDb.get
        .mockResolvedValueOnce(mockConversation)    // 检查conversation存在
        .mockResolvedValueOnce(updatedConversation) // 获取更新后的conversation
        .mockResolvedValueOnce(mockTask)            // buildConversationFromRow中获取task
        .mockResolvedValueOnce(mockRole);           // buildConversationFromRow中获取role
      
      mockDb.run.mockResolvedValue();
      mockDb.all.mockResolvedValue([]); // 没有消息

      const result = await conversationService.updateConversation('conversation-1', updateData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE conversations SET name = ?, updated_at = ? WHERE id = ?',
        ['更新的对话', expect.any(String), 'conversation-1']
      );
      expect(result.name).toBe('更新的对话'); // 应该返回更新后的name
    });

    it('should throw NotFoundError when conversation does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(conversationService.updateConversation('nonexistent', { name: '更新' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('deleteConversation', () => {
    it('should delete existing conversation', async () => {
      mockDb.get.mockResolvedValue(mockConversation);
      mockDb.run.mockResolvedValue();

      await conversationService.deleteConversation('conversation-1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM conversations WHERE id = ?', ['conversation-1']);
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM conversations WHERE id = ?', ['conversation-1']);
    });

    it('should throw NotFoundError when conversation does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      await expect(conversationService.deleteConversation('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('sendMessage', () => {
    it('should send message to existing conversation', async () => {
      const messageData = {
        role: 'user' as const,
        content: '你好，我想练习销售技巧'
      };

      const createdMessage = {
        id: 'new-message-id',
        conversation_id: 'conversation-1',
        role: 'user',
        content: '你好，我想练习销售技巧',
        timestamp: '2024-01-01'
      };

      mockDb.get
        .mockResolvedValueOnce(mockConversation) // 检查conversation存在
        .mockResolvedValueOnce(createdMessage);  // 获取创建的message
      
      mockDb.run.mockResolvedValue();

      const result = await conversationService.sendMessage('conversation-1', messageData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO messages (id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [expect.any(String), 'conversation-1', 'user', '你好，我想练习销售技巧', expect.any(String)]
      );
      expect(result.content).toBe('你好，我想练习销售技巧');
      expect(result.role).toBe('user');
    });

    it('should throw NotFoundError when conversation does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const messageData = {
        role: 'user' as const,
        content: '测试消息'
      };

      await expect(conversationService.sendMessage('nonexistent', messageData))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
