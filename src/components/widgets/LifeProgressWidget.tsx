import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Heart } from '@/utils/icons';
import { LifeProgressWidgetSettings } from '../../types/widgets';

interface LifeProgressWidgetProps {
  settings: LifeProgressWidgetSettings;
  onUpdateSettings: (settings: Partial<LifeProgressWidgetSettings>) => void;
}

const LifeProgressWidget: React.FC<LifeProgressWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [birthDate, setBirthDate] = useState(settings.birthDate || '1990-01-01');
  const [lifeExpectancy, setLifeExpectancy] = useState(settings.lifeExpectancy || 80);
  const [progress, setProgress] = useState({ year: 0, month: 0, day: 0, week: 0 });

  useEffect(() => {
    const calculateProgress = () => {
      const birth = new Date(birthDate).getTime();
      const now = Date.now();
      const lifeMs = lifeExpectancy * 365.25 * 24 * 60 * 60 * 1000;
      const livedMs = now - birth;
      
      const yearProgress = Math.min((livedMs / lifeMs) * 100, 100);
      
      // 计算今年已过的进度
      const nowDate = new Date();
      const startOfYear = new Date(nowDate.getFullYear(), 0, 1);
      const endOfYear = new Date(nowDate.getFullYear() + 1, 0, 1);
      const monthProgress = ((nowDate.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;
      
      // 计算本月进度
      const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const endOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
      const dayProgress = ((nowDate.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100;
      
      // 计算本周进度
      const dayOfWeek = nowDate.getDay() || 7;
      const weekProgress = ((dayOfWeek - 1) / 7) * 100;
      
      setProgress({
        year: yearProgress,
        month: monthProgress,
        day: dayProgress,
        week: weekProgress
      });
    };
    
    calculateProgress();
    const timer = setInterval(calculateProgress, 60000); // 每分钟更新
    return () => clearInterval(timer);
  }, [birthDate, lifeExpectancy]);

  const getProgressColor = (value: number) => {
    if (value < 30) return 'bg-green-500';
    if (value < 60) return 'bg-yellow-500';
    if (value < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const ProgressBar = ({ label, value, subtext }: { label: string; value: number; subtext: string }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">{subtext}</div>
    </div>
  );

  const birth = new Date(birthDate);
  const now = new Date();
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const remainingYears = lifeExpectancy - age;

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">人生进度</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
        <div className="p-2 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">已走过的人生</div>
          <div className="text-2xl font-bold text-red-500">{age} <span className="text-sm font-normal">岁</span></div>
          <div className="text-xs text-slate-400">预计剩余约 {remainingYears} 年</div>
        </div>

        <ProgressBar 
          label="一生进度" 
          value={progress.year} 
          subtext={`${age}/${lifeExpectancy} 岁`}
        />
        <ProgressBar 
          label="今年已过" 
          value={progress.month} 
          subtext={`${now.getFullYear()}年`}
        />
        <ProgressBar 
          label="本月已过" 
          value={progress.day} 
          subtext={`${now.getMonth() + 1}月`}
        />
        <ProgressBar 
          label="本周已过" 
          value={progress.week} 
          subtext={`第 ${Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))} 周`}
        />
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              onUpdateSettings({ birthDate: e.target.value });
            }}
            className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          />
          <input
            type="number"
            value={lifeExpectancy}
            onChange={(e) => {
              setLifeExpectancy(Number(e.target.value));
              onUpdateSettings({ lifeExpectancy: Number(e.target.value) });
            }}
            min={50}
            max={120}
            className="w-16 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          />
          <span className="text-xs text-slate-400">岁</span>
        </div>
      </div>
    </div>
  );
};

export default LifeProgressWidget;
