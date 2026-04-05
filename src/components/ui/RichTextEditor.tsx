import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Image as ImageIcon, CheckSquare, Type, X, Link as LinkIcon
} from '@/utils/icons';

interface RichTextEditorProps {
  initialContent?: string;
  initialHtml?: string;
  onChange: (content: string, htmlContent: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  initialHtml = '',
  onChange,
  placeholder = '开始输入内容...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // 执行编辑器命令
  const execCommand = useCallback((command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerText || '', editorRef.current.innerHTML || '');
    }
  }, [onChange]);

  // 处理输入
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerText || '', editorRef.current.innerHTML || '');
    }
  };

  // 插入图片
  const insertImage = () => {
    if (!imageUrl.trim()) return;
    execCommand('insertImage', imageUrl.trim());
    setImageUrl('');
    setShowImageInput(false);
  };

  // 插入链接
  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl.trim();
    execCommand('createLink', linkUrl.trim());
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
  };

  // 工具栏按钮
  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    value,
    active = false 
  }: { 
    icon: any; 
    command: string; 
    value?: string;
    active?: boolean;
  }) => (
    <button
      onClick={() => execCommand(command, value || '')}
      className={`p-1.5 rounded transition-colors
        ${active 
          ? 'bg-accent/20 text-accent' 
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden transition-colors
      ${isFocused 
        ? 'border-accent ring-2 ring-accent/20' 
        : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex-wrap">
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-700">
          <ToolbarButton icon={Bold} command="bold" />
          <ToolbarButton icon={Italic} command="italic" />
          <ToolbarButton icon={Underline} command="underline" />
        </div>
        
        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
          <ToolbarButton icon={List} command="insertUnorderedList" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
          <ToolbarButton icon={CheckSquare} command="insertHTML" value='<input type="checkbox" disabled /> ' />
        </div>
        
        <div className="flex items-center gap-0.5 pl-2">
          <button
            onClick={() => {
              setShowImageInput(!showImageInput);
              setShowLinkInput(false);
            }}
            className={`p-1.5 rounded transition-colors
              ${showImageInput ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowLinkInput(!showLinkInput);
              setShowImageInput(false);
            }}
            className={`p-1.5 rounded transition-colors
              ${showLinkInput ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 图片输入框 */}
      {showImageInput && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="输入图片 URL"
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={insertImage}
              className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
            >
              插入
            </button>
            <button
              onClick={() => setShowImageInput(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* 链接输入框 */}
      {showLinkInput && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="链接 URL"
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="链接文字（可选）"
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={insertLink}
              className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
            >
              插入
            </button>
            <button
              onClick={() => setShowLinkInput(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* 编辑器区域 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 min-h-[200px] p-3 outline-none text-slate-700 dark:text-slate-300
                   prose prose-sm dark:prose-invert max-w-none"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
        dangerouslySetInnerHTML={{ __html: initialHtml || initialContent }}
        data-placeholder={placeholder}
      />
      
      {/* 提示文字 */}
      {!initialHtml && !initialContent && (
        <div className="absolute inset-0 p-3 pointer-events-none text-slate-400 text-sm">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
