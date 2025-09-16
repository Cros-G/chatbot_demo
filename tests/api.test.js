// 简单的API测试脚本
// 运行: node tests/api.test.js

const http = require('http');

const API_BASE = 'http://localhost:3001';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 开始API测试...\n');

  try {
    // 测试健康检查
    console.log('1. 测试健康检查');
    const health = await makeRequest('/health');
    console.log(`   状态: ${health.status}`);
    console.log(`   响应: ${JSON.stringify(health.data)}\n`);

    // 测试获取任务列表
    console.log('2. 测试获取任务列表');
    const tasks = await makeRequest('/api/tasks');
    console.log(`   状态: ${tasks.status}`);
    console.log(`   响应: ${JSON.stringify(tasks.data)}\n`);

    // 测试创建任务
    console.log('3. 测试创建任务');
    const newTask = {
      name: '测试任务',
      description: '这是一个测试任务',
      phases: [
        {
          name: '测试阶段',
          order_index: 1,
          key_behaviors: [
            { description: '积极行为', type: 'positive' }
          ],
          key_phrases: ['你好', '测试话术']
        }
      ]
    };
    const createResult = await makeRequest('/api/tasks', 'POST', newTask);
    console.log(`   状态: ${createResult.status}`);
    console.log(`   响应: ${JSON.stringify(createResult.data, null, 2)}\n`);

    console.log('✅ API测试完成!');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 请确保后端服务正在运行: npm run dev:backend');
  }
}

runTests();
