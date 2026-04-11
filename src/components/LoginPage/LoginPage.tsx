import React, { useState, useEffect } from 'react';
import { OWNER_CONFIG, verifyAccessPassword, getData, setData } from '../../utils/constants';
import './LoginPage.css';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(() => {
    return getData('access_granted', false);
  });
  const [loading, setLoading] = useState(false);

  // 页面加载时设置标题
  useEffect(() => {
    document.title = `登录 - ${OWNER_CONFIG.siteName}`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 模拟网络延迟，防止暴力破解
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (verifyAccessPassword(password)) {
      setData('access_granted', true);
      window.location.reload();
    } else {
      setError('密码错误，请重试');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>{OWNER_CONFIG.siteName}</h1>
          <p>欢迎回来，ljq</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={OWNER_CONFIG.username}
              disabled
              className="disabled-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>© 2026 {OWNER_CONFIG.siteName}</p>
        </div>
      </div>
    </div>
  );
}
