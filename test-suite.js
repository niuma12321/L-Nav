// 自动化测试脚本
const tests = {
  async testAPI() {
    console.log('🔍 测试 API 连接...');
    try {
      const res = await fetch('https://y-nav-frontend.vercel.app/api/v1/sync?action=whoami');
      const data = await res.json();
      console.log('✅ API 正常:', data);
      return true;
    } catch (e) {
      console.log('❌ API 错误:', e.message);
      return false;
    }
  },
  
  async testHealth() {
    console.log('🔍 测试健康检查...');
    try {
      const res = await fetch('https://y-nav-frontend.vercel.app/api/v1/sync?action=health');
      const data = await res.json();
      console.log('✅ 健康检查:', data.status);
      return data.status === 'ok';
    } catch (e) {
      console.log('❌ 健康检查失败:', e.message);
      return false;
    }
  },
  
  async testSync() {
    console.log('🔍 测试同步功能...');
    try {
      const res = await fetch('https://y-nav-frontend.vercel.app/api/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jk712732' },
        body: JSON.stringify({ test: true })
      });
      const data = await res.json();
      console.log('✅ 同步接口:', data.success ? '正常' : '失败');
      return data.success;
    } catch (e) {
      console.log('❌ 同步失败:', e.message);
      return false;
    }
  }
};

async function runTests() {
  console.log('🚀 开始全面测试...\n');
  const results = [];
  for (const [name, test] of Object.entries(tests)) {
    results.push(await test());
  }
  const passed = results.filter(r => r).length;
  console.log(`\n📊 测试结果: ${passed}/${results.length} 通过`);
}

runTests();
