// 测试OpenAI服务 - Linus风格：直接测试核心功能
const { openaiService } = require('./dist/services/openaiService');

async function testOpenAI() {
  console.log('🧪 测试OpenAI服务...');
  
  try {
    const task = {
      id: '1',
      name: '测试任务',
      description: '测试',
      phases: []
    };
    
    const role = {
      id: '1', 
      name: '测试角色',
      personality: '友好',
      speaking_style: '专业',
      background: '测试背景'
    };
    
    const messages = [
      { id: '1', role: 'user', content: '你好', timestamp: new Date() }
    ];
    
    const response = await openaiService.generateResponse(task, role, messages, 10, 'gpt-3.5-turbo');
    
    console.log('✅ OpenAI调用成功!');
    console.log('回复长度:', response.length);
    console.log('回复前100字符:', response.substring(0, 100));
    
  } catch (error) {
    console.error('❌ OpenAI调用失败:', error.message);
    process.exit(1);
  }
}

testOpenAI();

