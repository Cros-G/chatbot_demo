// 快速测试AI回复解析器 - Linus风格：简单直接的测试
const { aiResponseParser } = require('./dist/services/aiResponseParser');

const testResponse = `
<progress_status>
\`\`\`json
{
    "当前状态编号":"S2",
    "当前状态名称":"信息吸收"
}
\`\`\`
</progress_status>
<key_points_update>
\`\`\`json
{
    "关注点编号":"1",
    "关注点描述": "在ALK阳性局晚/转移性非小细胞肺癌的一线治疗中，对于没有基线脑转移的患者，洛拉替尼相比阿来替尼是否有足够强的临床证据",
    "回应程度": "一般",
    "回应情况总结": "学员提到了一些数据，但没有具体引用CROWN研究的关键数据"
}
\`\`\`
</key_points_update>
<response>
好的，我理解您的关注。确实，对于无脑转移的初治患者，我们需要看到更强有力的证据。让我为您介绍一下CROWN研究的具体数据...
</response>
`;

console.log('🧪 测试AI回复解析器...');
const result = aiResponseParser.parseResponse(testResponse);

console.log('解析结果:');
console.log('- 是否有效:', result.isValid);
console.log('- 进度状态:', result.progressStatus);
console.log('- 关注点更新:', result.keyPointsUpdate);
console.log('- 回复内容:', result.response?.substring(0, 50) + '...');

if (result.isValid) {
  console.log('✅ 解析器测试通过!');
} else {
  console.log('❌ 解析器测试失败!');
  process.exit(1);
}

