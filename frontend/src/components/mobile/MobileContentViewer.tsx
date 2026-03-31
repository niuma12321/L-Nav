import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCw, Maximize, Minimize, ZoomIn, ZoomOut, RefreshCw, Move } from 'lucide-react';

interface MobileContentViewerProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const MobileContentViewer: React.FC<MobileContentViewerProps> = ({
  url,
  isOpen,
  onClose,
  title
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; distance?: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // 重置状态
  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 旋转
  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // 缩放
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指拖动
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (scale > 1) {
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      // 双指缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance: Math.sqrt(dx * dx + dy * dy)
      };
    }
  }, [scale]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && lastTouchRef.current) {
      // 单指拖动平移
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchStartRef.current?.distance) {
      // 双指缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const scaleChange = distance / touchStartRef.current.distance;
      setScale(prev => Math.min(Math.max(prev * scaleChange, 0.5), 3));
      
      touchStartRef.current.distance = distance;
    }
  }, [isDragging]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchRef.current = null;
    touchStartRef.current = null;
  }, []);

  // 双击缩放
  const handleDoubleClick = useCallback(() => {
    if (scale !== 1) {
      resetView();
    } else {
      setScale(2);
    }
  }, [scale, resetView]);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 自动隐藏控制栏
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDragging) setShowControls(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showControls, isDragging]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={() => setShowControls(true)}
    >
      {/* 顶部标题栏 */}
      <div className={`
        flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md
        transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-white font-medium truncate max-w-[200px]">
            {title || '内容预览'}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* 内容区域 */}
      <div 
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="w-full h-full transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="内容预览"
          />
        </div>

        {/* 手势提示 */}
        {scale === 1 && !isDragging && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-xs pointer-events-none">
            双击缩放 · 双指捏合 · 单指拖动
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div className={`
        absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/90 to-transparent
        transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={zoomOut}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={resetView}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={rotate}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={zoomIn}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileContentViewer;
