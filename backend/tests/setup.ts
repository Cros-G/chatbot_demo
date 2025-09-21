// Jest测试设置文件
// 在这里可以设置全局的测试配置和mock

// 设置测试超时时间
jest.setTimeout(10000);

// Mock console.log 在测试中减少噪音
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
