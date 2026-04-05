import React from 'react';
import { ExternalLink } from 'lucide-react';
import { WidgetConfig } from '../../types/widgets';

interface IframeWidgetProps {
  widget: WidgetConfig & { settings: { url: string; width?: string; height?: string; allowScroll?: boolean; showBorder?: boolean; showHeader?: boolean } };
}

export const IframeWidget: React.FC<IframeWidgetProps> = ({ widget }) => {
  const { 
    url, 
    width = '100%', 
    height = '300px', 
    allowScroll = true, 
    showBorder = true, 
    showHeader = true 
  } = widget.settings;

  if (!url) {
    return (
      <div className={`bg-[#181a1c] rounded-xl flex items-center justify-center ${showBorder ? 'border border-white/10' : ''}`}
        style={{ height }}
      >
        <div className="text-slate-500 text-sm">请配置内嵌 URL</div>
      </div>
    );
  }

  return (
    <div className={`bg-[#181a1c] rounded-xl overflow-hidden flex flex-col ${showBorder ? 'border border-white/10' : ''}`}>
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#181a1c]">
          <span className="font-medium text-xs text-slate-400 truncate">{widget.title}</span>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
            title="在新标签页打开"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="flex-1 overflow-hidden" style={{ height: showHeader ? `calc(${height} - 36px)` : height }}>
        <iframe
          src={url}
          className="w-full h-full border-0"
          style={{ 
            width: width, 
            height: '100%',
            overflow: allowScroll ? 'auto' : 'hidden'
          }}
          title={widget.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default IframeWidget;
