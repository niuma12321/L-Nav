import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CircleDot, Volume2, VolumeX } from '@/utils/icons';
import { ZenWidgetSettings } from '../../types/widgets';

interface ZenWidgetProps {
  settings: ZenWidgetSettings;
  onUpdateSettings: (settings: Partial<ZenWidgetSettings>) => void;
}

const ZenWidget: React.FC<ZenWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [count, setCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [animationEnabled, setAnimationEnabled] = useState(settings.animationEnabled ?? true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化音频
  useEffect(() => {
    // 使用 Web Audio API 创建简单的木鱼声音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playSound = () => {
      if (!soundEnabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    (window as any).playMuyuSound = playSound;
    
    return () => {
      delete (window as any).playMuyuSound;
    };
  }, [soundEnabled]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    setCount(prev => prev + 1);
    setIsAnimating(true);
    
    // 添加涟漪效果
    if (containerRef.current && animationEnabled) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
    
    // 播放声音
    if ((window as any).playMuyuSound) {
      (window as any).playMuyuSound();
    }
    
    setTimeout(() => setIsAnimating(false), 150);
  }, [animationEnabled]);

  const resetCount = () => {
    setCount(0);
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center h-full p-3 relative overflow-hidden"
      onClick={handleClick}
    >
      {/* 涟漪效果 */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.3)',
          }}
        />
      ))}

      {/* 控制按钮 */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled(!soundEnabled);
            onUpdateSettings({ soundEnabled: !soundEnabled });
          }}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-3 h-3 text-slate-400" />
          ) : (
            <VolumeX className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>

      {/* 木鱼图标 */}
      <div 
        className={`
          relative cursor-pointer select-none
          transition-transform duration-150
          ${isAnimating ? 'scale-95' : 'scale-100'}
        `}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg flex items-center justify-center">
          <CircleDot className="w-8 h-8 text-white" />
        </div>
        {/* 功德数字 */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">+1</span>
        </div>
      </div>

      {/* 计数 */}
      <div className="mt-3 text-center">
        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {count.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400">功德</div>
      </div>

      {/* 重置按钮 */}
      {count > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetCount();
          }}
          className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          重置
        </button>
      )}

      {/* 提示文字 */}
      <div className="absolute bottom-2 text-xs text-slate-300 dark:text-slate-600">
        点击积攒功德
      </div>
    </div>
  );
};

export default ZenWidget;
