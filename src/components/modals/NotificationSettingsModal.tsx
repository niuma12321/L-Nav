import React, { useState } from 'react';
import { X, Save, Mail, Globe, Link2, BookOpen, MessageSquare, Briefcase, AlertCircle } from '@/utils/icons';
import { useNotifications } from '../../hooks/useNotifications';

// 渠道列表
const channelList = [
  { key: 'browser', label: '浏览器', icon: Globe },
  { key: 'email', label: '邮箱', icon: Mail },
  { key: 'webhook', label: 'Webhook', icon: Link2 },
  { key: 'feishu', label: '飞书', icon: BookOpen },
  { key: 'dingtalk', label: '钉钉', icon: MessageSquare },
  { key: 'wecom', label: '企业微信', icon: Briefcase },
  { key: 'wechat', label: '微信', icon: AlertCircle },
  { key: 'telegram', label: 'Telegram', icon: MessageSquare },
];

// 通知类型分组
const typeGroups = [
  { prefix: 'success', title: '任务成功', icon: '✅', desc: '自动化任务、价格监控等执行成功' },
  { prefix: 'fail', title: '任务失败', icon: '❌', desc: '任务执行失败、异常终止' },
  { prefix: 'alert', title: '设备告警', icon: '⚠️', desc: '智能家居设备异常、离线' },
  { prefix: 'notice', title: '系统通知', icon: '📢', desc: '系统公告、功能更新' },
];

interface NotificationSettingsModalProps {
  userId: string;
  onClose: () => void;
}

export function NotificationSettingsModal({ userId, onClose }: NotificationSettingsModalProps) {
  const { settings, saveSettings, testPush } = useNotifications(userId);
  const [tab, setTab] = useState<'channel' | 'rule'>('channel');
  const [saving, setSaving] = useState(false);

  if (!settings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-2xl bg-gray-900 text-white shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-gray-400">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    onClose();
  };

  const handleTest = async (channel: string) => {
    try {
      await testPush(channel);
      alert(`已向 ${channel} 发送测试消息`);
    } catch {
      alert('测试发送失败，请检查配置');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold">通知中心设置</h2>
            <p className="text-sm text-gray-400 mt-1">配置多渠道推送 & 按类型开关</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50">
          <button
            onClick={() => setTab('channel')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'channel' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Link2 className="w-4 h-4" />
            渠道配置
          </button>
          <button
            onClick={() => setTab('rule')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'rule' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            推送开关
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === 'channel' && (
            <div className="space-y-5">
              {/* 邮箱 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">邮箱推送</h3>
                    <p className="text-xs text-gray-400">支持 SMTP 邮件发送</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="收件邮箱" 
                    value={settings.email_to} 
                    onChange={e => saveSettings({ ...settings, email_to: e.target.value })} 
                  />
                  <input 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="SMTP 服务器" 
                    value={settings.smtp_host} 
                    onChange={e => saveSettings({ ...settings, smtp_host: e.target.value })} 
                  />
                  <input 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="端口 (默认 465)" 
                    type="number"
                    value={settings.smtp_port} 
                    onChange={e => saveSettings({ ...settings, smtp_port: Number(e.target.value) })} 
                  />
                  <input 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="SMTP 账号" 
                    value={settings.smtp_user} 
                    onChange={e => saveSettings({ ...settings, smtp_user: e.target.value })} 
                  />
                  <input 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none md:col-span-2" 
                    placeholder="授权码 / 密码" 
                    type="password"
                    value={settings.smtp_pass} 
                    onChange={e => saveSettings({ ...settings, smtp_pass: e.target.value })} 
                  />
                </div>
                <button 
                  onClick={() => handleTest('email')} 
                  className="mt-3 text-sm bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  测试邮箱推送
                </button>
              </div>

              {/* 浏览器推送 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Globe className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">浏览器推送</h3>
                    <p className="text-xs text-gray-400">桌面通知，需要授权</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleTest('browser')} 
                  className="text-sm bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  测试浏览器推送
                </button>
              </div>

              {/* Webhook */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Link2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">通用 Webhook</h3>
                    <p className="text-xs text-gray-400">自定义 HTTP 回调</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Webhook URL" 
                    value={settings.webhook_url} 
                    onChange={e => saveSettings({ ...settings, webhook_url: e.target.value })} 
                  />
                  <textarea 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    rows={2} 
                    placeholder='Headers JSON，如 {"Authorization": "Bearer xxx"}' 
                    value={settings.webhook_headers} 
                    onChange={e => saveSettings({ ...settings, webhook_headers: e.target.value })} 
                  />
                </div>
                <button 
                  onClick={() => handleTest('webhook')} 
                  className="mt-3 text-sm bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                >
                  测试 Webhook
                </button>
              </div>

              {/* 飞书 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <BookOpen className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">飞书机器人</h3>
                    <p className="text-xs text-gray-400">群机器人消息推送</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Webhook 地址" 
                    value={settings.feishu_webhook} 
                    onChange={e => saveSettings({ ...settings, feishu_webhook: e.target.value })} 
                  />
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="签名密钥（可选）" 
                    value={settings.feishu_secret} 
                    onChange={e => saveSettings({ ...settings, feishu_secret: e.target.value })} 
                  />
                </div>
                <button 
                  onClick={() => handleTest('feishu')} 
                  className="mt-3 text-sm bg-teal-500/10 text-teal-400 px-4 py-2 rounded-lg hover:bg-teal-500/20 transition-colors"
                >
                  测试飞书推送
                </button>
              </div>

              {/* 钉钉 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">钉钉机器人</h3>
                    <p className="text-xs text-gray-400">群机器人消息推送</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Webhook 地址" 
                    value={settings.dingtalk_webhook} 
                    onChange={e => saveSettings({ ...settings, dingtalk_webhook: e.target.value })} 
                  />
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="加签密钥（可选）" 
                    value={settings.dingtalk_secret} 
                    onChange={e => saveSettings({ ...settings, dingtalk_secret: e.target.value })} 
                  />
                </div>
                <button 
                  onClick={() => handleTest('dingtalk')} 
                  className="mt-3 text-sm bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                >
                  测试钉钉推送
                </button>
              </div>

              {/* 企业微信 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">企业微信机器人</h3>
                    <p className="text-xs text-gray-400">群机器人消息推送</p>
                  </div>
                </div>
                <input 
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                  placeholder="Webhook 地址" 
                  value={settings.wecom_webhook} 
                  onChange={e => saveSettings({ ...settings, wecom_webhook: e.target.value })} 
                />
                <button 
                  onClick={() => handleTest('wecom')} 
                  className="mt-3 text-sm bg-green-500/10 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-colors"
                >
                  测试企业微信推送
                </button>
              </div>

              {/* Server酱 */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">微信推送（Server酱）</h3>
                    <p className="text-xs text-gray-400">微信消息推送服务</p>
                  </div>
                </div>
                <input 
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                  placeholder="SCKEY" 
                  value={settings.serverchan_sckey} 
                  onChange={e => saveSettings({ ...settings, serverchan_sckey: e.target.value })} 
                />
                <button 
                  onClick={() => handleTest('wechat')} 
                  className="mt-3 text-sm bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  测试微信推送
                </button>
              </div>

              {/* Telegram */}
              <div className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-sky-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Telegram 机器人</h3>
                    <p className="text-xs text-gray-400">通过 Bot 发送消息</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Bot Token (如: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)" 
                    value={settings.telegram_bot_token} 
                    onChange={e => saveSettings({ ...settings, telegram_bot_token: e.target.value })} 
                  />
                  <input 
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Chat ID (如: 123456789 或 -1001234567890)" 
                    value={settings.telegram_chat_id} 
                    onChange={e => saveSettings({ ...settings, telegram_chat_id: e.target.value })} 
                  />
                </div>
                <button 
                  onClick={() => handleTest('telegram')} 
                  className="mt-3 text-sm bg-sky-500/10 text-sky-400 px-4 py-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                >
                  测试 Telegram 推送
                </button>
              </div>
            </div>
          )}

          {tab === 'rule' && (
            <div className="space-y-5">
              {typeGroups.map(g => (
                <div key={g.prefix} className="rounded-xl bg-gray-800/50 p-5 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700/50">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <h3 className="font-semibold">{g.title}</h3>
                      <p className="text-xs text-gray-400">{g.desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    {channelList.map(ch => {
                      const key = `${g.prefix}_${ch.key}` as keyof typeof settings;
                      const checked = !!settings[key];
                      return (
                        <label 
                          key={ch.key} 
                          className="flex flex-col items-center gap-2 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                        >
                          <ch.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-300">{ch.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => {
                              const val = e.target.checked ? 1 : 0;
                              saveSettings({ ...settings, [key]: val });
                            }}
                            className="w-4 h-4 accent-emerald-500 rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              配置修改后自动保存
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存并关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
