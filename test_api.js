// 简单的API测试脚本
async function testQueryCharacters() {
  try {
    console.log('测试 queryCharacters API...');
    
    // 测试本地API
    const response = await fetch('http://localhost:3000/api/queryCharacters?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API响应:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ API调用成功!');
      console.log(`返回 ${data.data?.length || 0} 条角色数据`);
    } else {
      console.log('❌ API调用失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testQueryCharacters();