import React, { useState, useEffect } from 'react';
import { 
  getBackups, 
  restoreFromBackup, 
  deleteBackup,
  exportAllData, 
  importAllData,
  clearAllData
} from '../../utils/constants';
import './DataManagementSection.css';

export default function DataManagementSection() {
  const [backups, setBackups] = useState(getBackups());
  const [importing, setImporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 刷新备份列表
  const refreshBackups = () => {
    setBackups(getBackups());
  };

  // 导出数据
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ynav_ljq_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (importAllData(content)) {
        alert('✅ 导入成功！页面将刷新以应用新数据');
        window.location.reload();
      } else {
        alert('❌ 导入失败，请检查文件格式是否正确');
      }
      
      setImporting(false);
      e.target.value = '';
    };
    
    reader.readAsText(file);
  };

  // 恢复备份
  const handleRestore = (index: number) => {
    if (confirm('⚠️ 确定要恢复此备份吗？当前所有数据将被覆盖！')) {
      if (restoreFromBackup(index)) {
        alert('✅ 恢复成功！页面将刷新以应用备份数据');
        window.location.reload();
      } else {
        alert('❌ 恢复失败');
      }
    }
  };

  // 删除备份
  const handleDeleteBackup = (index: number) => {
    if (confirm('确定要删除此备份吗？')) {
      deleteBackup(index);
      refreshBackups();
    }
  };

  // 清空所有数据
  const handleClearAllData = () => {
    if (confirm('⚠️ 危险操作！确定要清空所有数据吗？此操作不可恢复！')) {
      clearAllData();
      alert('✅ 所有数据已清空，页面将刷新');
      window.location.reload();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="data-management-section">
      <h3>数据管理</h3>
      <p className="section-desc">管理你的导航站数据，包括导出、导入和备份恢复</p>
      
      {/* 手动备份与恢复 */}
      <div className="section-card">
        <h4>手动备份与恢复</h4>
        <div className="button-group">
          <button onClick={handleExport} className="btn btn-primary">
            📤 导出所有数据
          </button>
          
          <label className="btn btn-secondary">
            {importing ? '⏳ 导入中...' : '📥 导入数据'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      {/* 自动备份列表 */}
      <div className="section-card">
        <div className="section-header">
          <h4>自动备份列表</h4>
          <button onClick={refreshBackups} className="btn btn-sm btn-outline">
            🔄 刷新
          </button>
        </div>
        <p className="section-note">系统每天自动备份一次，保留最近 30 天的备份</p>
        
        <div className="backup-list">
          {backups.length === 0 ? (
            <div className="empty-state">
              <p>暂无自动备份</p>
              <p className="small">系统将在今天晚些时候自动创建第一个备份</p>
            </div>
          ) : (
            backups.map((backup, index) => (
              <div key={backup.timestamp} className="backup-item">
                <span className="backup-date">{backup.date}</span>
                <div className="backup-actions">
                  <button 
                    onClick={() => handleRestore(index)} 
                    className="btn btn-sm btn-primary"
                  >
                    恢复
                  </button>
                  <button 
                    onClick={() => handleDeleteBackup(index)} 
                    className="btn btn-sm btn-danger"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 危险操作 */}
      <div className="section-card danger-zone">
        <h4>危险操作</h4>
        <p className="section-note">以下操作不可逆，请谨慎操作</p>
        
        {!showClearConfirm ? (
          <button 
            onClick={() => setShowClearConfirm(true)} 
            className="btn btn-danger"
          >
            🗑️ 清空所有数据
          </button>
        ) : (
          <div className="confirm-dialog">
            <p>⚠️ 确定要清空所有数据吗？此操作不可恢复！</p>
            <div className="confirm-actions">
              <button 
                onClick={() => setShowClearConfirm(false)} 
                className="btn btn-sm btn-secondary"
              >
                取消
              </button>
              <button 
                onClick={handleClearAllData} 
                className="btn btn-sm btn-danger"
              >
                确认清空
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
