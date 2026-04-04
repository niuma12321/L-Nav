// Test script to verify all 60s API response formats
// Run with: node test-apis.js

const API_60S_BASE = 'https://60s.viki.moe';

const APIs = [
  // 周期资讯类
  { id: '60s-news', endpoint: '/v2/60s', dataPath: 'data.news', expectedType: 'array' },
  { id: 'ai-news', endpoint: '/v2/ai-news', dataPath: 'data', expectedType: 'array' },
  { id: 'it-news', endpoint: '/v2/ithome', dataPath: 'data', expectedType: 'array' },
  { id: 'bing-wallpaper', endpoint: '/v2/bing', dataPath: 'data', expectedType: 'object' },
  { id: 'exchange-rate', endpoint: '/v2/exchange-rate', dataPath: 'data', expectedType: 'array' },
  { id: 'history-today', endpoint: '/v2/today-in-history', dataPath: 'data', expectedType: 'array' },
  { id: 'epic-games', endpoint: '/v2/epic', dataPath: 'data', expectedType: 'array' },
  // 实用功能类
  { id: 'gold-price', endpoint: '/v2/gold', dataPath: 'data', expectedType: 'array' },
  { id: 'oil-price', endpoint: '/v2/oil', dataPath: 'data', expectedType: 'array' },
  { id: 'moyu-daily', endpoint: '/v2/moyu', dataPath: 'data', expectedType: 'array' },
  { id: 'weather', endpoint: '/v2/weather?cityId=101010100', dataPath: 'data', expectedType: 'object' },
  { id: 'weather-forecast', endpoint: '/v2/weather-forecast?cityId=101010100', dataPath: 'data', expectedType: 'array' },
  { id: 'ip-info', endpoint: '/v2/ip', dataPath: 'data', expectedType: 'object' },
  // 热门榜单类
  { id: 'douyin-hot', endpoint: '/v2/douyin', dataPath: 'data', expectedType: 'array' },
  { id: 'xiaohongshu-hot', endpoint: '/v2/xiaohongshu', dataPath: 'data', expectedType: 'array' },
  { id: 'bilibili-hot', endpoint: '/v2/bili', dataPath: 'data', expectedType: 'array' },
  { id: 'weibo-hot', endpoint: '/v2/weibo', dataPath: 'data', expectedType: 'array' },
  { id: 'zhihu-hot', endpoint: '/v2/zhihu', dataPath: 'data', expectedType: 'array' },
  { id: 'baidu-hot', endpoint: '/v2/baidu', dataPath: 'data', expectedType: 'array' },
  { id: 'quark-hot', endpoint: '/v2/quark', dataPath: 'data', expectedType: 'array' },
  { id: 'dongchedi-hot', endpoint: '/v2/dongchedi', dataPath: 'data', expectedType: 'array' },
  { id: 'toutiao-hot', endpoint: '/v2/toutiao', dataPath: 'data', expectedType: 'array' },
  { id: 'hackernews-hot', endpoint: '/v2/hackernews', dataPath: 'data', expectedType: 'array' },
  // 消遣娱乐类
  { id: 'random-quote', endpoint: '/v2/hitokoto', dataPath: 'data', expectedType: 'object' },
  { id: 'random-joke', endpoint: '/v2/joke', dataPath: 'data', expectedType: 'object' },
  { id: 'random-cold-joke', endpoint: '/v2/cold-joke', dataPath: 'data', expectedType: 'object' },
  { id: 'random-fortune', endpoint: '/v2/fortune', dataPath: 'data', expectedType: 'object' },
  { id: 'kfc-v50', endpoint: '/v2/kfc', dataPath: 'data', expectedType: 'object' },
];

async function testAPI(api) {
  try {
    const response = await fetch(`${API_60S_BASE}${api.endpoint}`);
    if (!response.ok) {
      return { ...api, status: 'error', error: `HTTP ${response.status}` };
    }
    const json = await response.json();
    
    // Extract data using dataPath
    let data = json;
    if (api.dataPath) {
      const parts = api.dataPath.split('.');
      for (const part of parts) {
        data = data?.[part];
      }
    }
    
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    const isMatch = actualType === api.expectedType || 
      (api.expectedType === 'array' && Array.isArray(data));
    
    // Get sample of first item
    let sample = null;
    if (Array.isArray(data) && data.length > 0) {
      sample = data[0];
    } else if (typeof data === 'object' && data !== null) {
      sample = data;
    }
    
    return {
      ...api,
      status: isMatch ? 'ok' : 'format-mismatch',
      actualType,
      dataLength: Array.isArray(data) ? data.length : 1,
      sampleKeys: sample ? Object.keys(sample).slice(0, 5) : null
    };
  } catch (err) {
    return { ...api, status: 'error', error: err.message };
  }
}

async function runTests() {
  console.log('Testing all 60s APIs...\n');
  
  const results = [];
  for (const api of APIs) {
    const result = await testAPI(api);
    results.push(result);
    
    const icon = result.status === 'ok' ? '✅' : 
                 result.status === 'format-mismatch' ? '⚠️' : '❌';
    console.log(`${icon} ${api.id}`);
    console.log(`   Endpoint: ${api.endpoint}`);
    console.log(`   Expected: ${api.expectedType}, Got: ${result.actualType}`);
    if (result.dataLength) {
      console.log(`   Data count: ${result.dataLength}`);
    }
    if (result.sampleKeys) {
      console.log(`   Keys: ${result.sampleKeys.join(', ')}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const warning = results.filter(r => r.status === 'format-mismatch').length;
  const error = results.filter(r => r.status === 'error').length;
  
  console.log('===================');
  console.log(`Total: ${results.length} APIs`);
  console.log(`✅ OK: ${ok}`);
  console.log(`⚠️ Format mismatch: ${warning}`);
  console.log(`❌ Error: ${error}`);
}

runTests();
