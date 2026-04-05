import React, { useState, useEffect } from 'react';
import { Bot, Settings, Save, Plus, Trash2, ExternalLink, Key, MessageSquare } from '@/utils/icons';

interface BotConfig {
  id: string;
  name: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enabled: boolean;
  icon?: string;
}

const DEFAULT_BOTS: BotConfig[] = [
  {
    id: 'gemini-default',
    name: 'Gemini Pro',
    apiKey: '',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '你是一个智能助手，可以帮助用户回答问题和完成任务。',
    enabled: true
  },
  {
    id: 'openai-default',
    name: 'GPT Assistant',
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '你是一个智能助手，可以帮助用户回答问题和完成任务。',
    enabled: false
  }
];

const STORAGE_KEY = 'ynav_custom_bots_v1';

export const CustomBotManager: React.FC = () => {
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从 localStorage 加载配置
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBots(parsed);
      } catch {
        setBots(DEFAULT_BOTS);
      }
    } else {
      setBots(DEFAULT_BOTS);
    }
    setIsLoaded(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
    }
  }, [bots, isLoaded]);

  const selectedBot = bots.find(b => b.id === selectedBotId);

  const updateBot = (id: string, updates: Partial<BotConfig>) => {
    setBots(prev => prev.map(bot => 
      bot.id === id ? { ...bot, ...updates } : bot
    ));
  };

  const addBot = () => {
    const newBot: BotConfig = {
      id: `bot-${Date.now()}`,
      name: '新 Bot',
      apiKey: '',
      apiEndpoint: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '你是一个智能助手。',
      enabled: true
    };
    setBots(prev => [...prev, newBot]);
    setSelectedBotId(newBot.id);
  };

  const deleteBot = (id: string) => {
    setBots(prev => prev.filter(b => b.id !== id));
    if (selectedBotId === id) {
      setSelectedBotId(null);
    }
  };

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(bot => 
      bot.id === id ? { ...bot, enabled: !bot.enabled } : bot
    ));
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">自定义 Bot 管理</h3>
          <p className="text-sm text-slate-400">配置和管理您的 AI 助手</p>
        </div>
        <button
          onClick={addBot}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          添加 Bot
        </button>
      </div>

      {/* Bot 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bots.map(bot => (
          <div
            key={bot.id}
            onClick={() => setSelectedBotId(bot.id)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedBotId === bot.id
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#181a1c] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bot.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{bot.name}</h4>
                  <p className="text-xs text-slate-400">{bot.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBot(bot.id);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    bot.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${bot.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBot(bot.id);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bot 配置详情 */}
      {selectedBot && (
        <div className="p-6 rounded-2xl bg-[#181a1c] border border-white/10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-white">{selectedBot.name} 配置</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Bot 名称</label>
              <input
                type="text"
                value={selectedBot.name}
                onChange={(e) => updateBot(selectedBot.id, { name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">模型</label>
              <input
                type="text"
                value={selectedBot.model}
                onChange={(e) => updateBot(selectedBot.id, { model: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </label>
              <input
                type="password"
                value={selectedBot.apiKey}
                onChange={(e) => updateBot(selectedBot.id, { apiKey: e.target.value })}
                placeholder="输入您的 API Key"
                className="w-full px-4 py-2.5 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                API Endpoint
              </label>
              <input
                type="text"
                value={selectedBot.apiEndpoint}
                onChange={(e) => updateBot(selectedBot.id, { apiEndpoint: e.target.value })}
                placeholder="https://api.example.com/v1/chat"
                className="w-full px-4 py-2.5 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Temperature ({selectedBot.temperature})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={selectedBot.temperature}
                onChange={(e) => updateBot(selectedBot.id, { temperature: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Max Tokens</label>
              <input
                type="number"
                value={selectedBot.maxTokens}
                onChange={(e) => updateBot(selectedBot.id, { maxTokens: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                系统提示词 (System Prompt)
              </label>
              <textarea
                value={selectedBot.systemPrompt}
                onChange={(e) => updateBot(selectedBot.id, { systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-[#242629] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
                alert('配置已保存');
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomBotManager;
