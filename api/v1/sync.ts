// Vercel Serverless Function: Y-Nav Sync API
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage for demo (replace with proper database in production)
let dataStore: any = null;

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Password, X-View-Password');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action } = req.query;
  const path = req.url || '';

  // Health check
  if (path.endsWith('/health') || action === 'health') {
    return res.json({
      success: true,
      status: 'healthy',
      timestamp: Date.now(),
      apiVersion: 'v1'
    });
  }

  // Whoami - auth status
  if (path.endsWith('/whoami') || action === 'whoami') {
    return res.json({
      success: true,
      apiVersion: 'v1',
      passwordRequired: false,
      canWrite: true,
      viewPasswordRequired: false,
      canView: true
    });
  }

  // GET - read data
  if (req.method === 'GET') {
    return res.json({
      success: true,
      data: dataStore,
      message: dataStore ? 'Data retrieved' : 'No data stored'
    });
  }

  // POST - save data
  if (req.method === 'POST') {
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'No data provided'
      });
    }
    
    dataStore = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: Date.now(),
        version: (dataStore?.meta?.version || 0) + 1
      }
    };
    
    return res.json({
      success: true,
      data: dataStore,
      message: 'Data saved successfully'
    });
  }

  // DELETE - clear data
  if (req.method === 'DELETE') {
    dataStore = null;
    return res.json({
      success: true,
      message: 'Data cleared'
    });
  }

  return res.status(404).json({
    success: false,
    error: 'Not Found'
  });
}
