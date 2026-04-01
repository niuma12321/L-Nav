import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ContentPreviewProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0e10]/95 backdrop-blur-sm">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-[#181a1c]">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">页面预览</span>
          <span className="text-xs text-slate-500 truncate max-w-[300px]">{url}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            新窗口打开
          </a>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="h-[calc(100vh-56px)]">
        <iframe
          src={url}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen"
        />
      </div>
    </div>
  );
};

export default ContentPreview;
