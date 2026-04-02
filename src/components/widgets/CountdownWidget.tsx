import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Plus, Trash2, Calendar } from 'lucide-react';
import { CountdownWidgetSettings, CountdownEvent } from '../../types/widgets';

interface CountdownWidgetProps {
  settings: CountdownWidgetSettings;
  onUpdateSettings: (settings: Partial<CountdownWidgetSettings>) => void;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [now, setNow] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateCountdown = (targetDate: string) => {
    const target = new Date(targetDate).getTime();
    const diff = target - now.getTime();
    
    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, passed: false };
  };

  const addEvent = () => {
    if (!newEventName.trim() || !newEventDate) return;
    
    const newEvent: CountdownEvent = {
      id: `countdown-${Date.now()}`,
      name: newEventName.trim(),
      targetDate: newEventDate,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 6)]
    };
    
    onUpdateSettings({
      events: [...(settings.events || []), newEvent]
    });
    
    setNewEventName('');
    setNewEventDate('');
    setShowAdd(false);
  };

  const deleteEvent = (id: string) => {
    onUpdateSettings({
      events: (settings.events || []).filter(e => e.id !== id)
    });
  };

  const events = settings.events || [];

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">倒计时</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4 text-accent" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="事件名称"
            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          />
          <input
            type="datetime-local"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={addEvent}
            className="w-full py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
          >
            添加
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Timer className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无倒计时</span>
          </div>
        ) : (
          events.map(event => {
            const countdown = calculateCountdown(event.targetDate);
            return (
              <div key={event.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {event.name}
                  </span>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {countdown.passed ? (
                    <span className="text-red-500">已结束</span>
                  ) : (
                    <>
                      {countdown.days > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold">
                          {countdown.days}天
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                        {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CountdownWidget;
