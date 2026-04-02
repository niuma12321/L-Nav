// Vercel Serverless Function: Y-Nav API v1
// Endpoint: /api/v1/sync

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  
  // 获取密码：从 Header 或 Body
  let password = req.headers.authorization?.replace('Bearer ', '');
  
  // 如果没有密码从 Header 获取，尝试从 body 获取
  if (!password && req.method === 'POST') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      const parsed = JSON.parse(body);
      password = parsed.password;
    } catch (e) {
      // body 解析失败，忽略
    }
  }

  // Health check
  if (action === 'health') {
    return res.status(200).json({ 
      status: 'ok', 
      version: 'v1',
      timestamp: new Date().toISOString()
    });
  }

  // Whoami check
  if (action === 'whoami') {
    return res.status(200).json({
      authenticated: password === 'jk712732',
      timestamp: new Date().toISOString()
    });
  }

  // GET sync
  if (req.method === 'GET' && !action) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No data found'
    });
  }

  // POST sync
  if (req.method === 'POST') {
    if (password !== 'jk712732') {
      return res.status(401).json({ error: 'Unauthorized', received: !!password });
    }
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });
  }

  res.status(400).json({ error: 'Bad request' });
}
