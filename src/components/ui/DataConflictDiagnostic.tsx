import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, RefreshCw, Trash2 } from '@/utils/icons';
import { getCurrentUserId, getUserProfiles, setCurrentUser, clearAllAppStorage } from '../../utils/constants';
import { useDialog } from '../ui/DialogProvider';

/**
 * 数据冲突诊断组件
 * 用于检测和解决数据权限账户问题
 */
export const DataConflictDiagnostic: React.FC = () => {
  const [currentUserId, setCurrentUserIdState] = useState<string>('');
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { notify, confirm } = useDialog();

  // 分析当前存储状态
  const analyzeStorage = () => {
    setIsAnalyzing(true);
    
    try {
      // 获取所有 localStorage 键
      const allKeys = Object.keys(localStorage);
      const appKeys = allKeys.filter(key => 
        key.includes('ynav_') || key.includes('user_')
      );
      
      setStorageKeys(appKeys);
      
      // 获取当前用户信息
      const userId = getCurrentUserId();
      setCurrentUserIdState(userId || '未设置');
      
      // 获取用户配置
      const profiles = getUserProfiles();
      setUserProfiles(profiles);
      
      console.log('[DataDiagnostic] Storage analysis complete:', {
        totalKeys: allKeys.length,
        appKeys: appKeys.length,
        currentUserId: userId,
        userProfiles: profiles.length
      });
      
    } catch (error) {
      console.error('[DataDiagnostic] Analysis failed:', error);
      notify('存储分析失败', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 切换用户
  const switchToUser = (userId: string) => {
    confirm({
      message: `确定要切换到用户 ${userId} 吗？这将重新加载页面。`
    }).then((confirmed) => {
      if (confirmed) {
        setCurrentUser(userId);
        window.location.reload();
      }
    });
  };

  // 清理冲突数据
  const cleanupConflicts = () => {
    confirm({
      message: '确定要清理所有冲突数据吗？这将删除所有应用数据并重新开始。'
    }).then((confirmed) => {
      if (confirmed) {
        clearAllAppStorage();
        window.location.reload();
      }
    });
  };

  // 初始化分析
  useEffect(() => {
    analyzeStorage();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          数据冲突诊断
        </h3>
      </div>

      {/* 当前状态 */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-sm text-slate-600 dark:text-slate-400">当前用户ID:</span>
          <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
            {currentUserId}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-sm text-slate-600 dark:text-slate-400">用户配置数量:</span>
          <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
            {userProfiles.length}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-sm text-slate-600 dark:text-slate-400">应用存储键:</span>
          <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
            {storageKeys.length}
          </span>
        </div>
      </div>

      {/* 用户列表 */}
      {userProfiles.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            用户配置
          </h4>
          <div className="space-y-2">
            {userProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  profile.id === currentUserId
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => switchToUser(profile.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {profile.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {profile.id}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(profile.lastActiveAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 存储键详情 */}
      {storageKeys.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            存储键详情
          </h4>
          <div className="max-h-40 overflow-y-auto">
            <div className="space-y-1">
              {storageKeys.map((key) => (
                <div
                  key={key}
                  className="text-xs font-mono text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-900 rounded"
                >
                  {key}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={analyzeStorage}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          重新分析
        </button>
        
        <button
          onClick={cleanupConflicts}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
          清理冲突数据
        </button>
      </div>

      {/* 诊断建议 */}
      <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <strong>诊断建议:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• 如果有多个用户配置，选择正确的用户切换</li>
            <li>• 如果存储键数量异常，考虑清理冲突数据</li>
            <li>• 如果当前用户ID为空，需要重新初始化</li>
            <li>• 多标签页同时操作可能导致数据冲突</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
