import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, Trash2, Loader } from 'lucide-react';
import { TodoWidgetSettings, TodoItem, TODO_STORAGE_KEY } from '../../types/widgets';

interface TodoWidgetProps {
  settings: TodoWidgetSettings;
  onUpdateSettings: (settings: Partial<TodoWidgetSettings>) => void;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ settings }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载待办事项
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TODO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTodos(parsed);
        }
      }
    } catch (error) {
      console.error('加载待办事项失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
      } catch (error) {
        console.error('保存待办事项失败:', error);
      }
    }
  }, [todos, isLoading]);

  const addTodo = useCallback(() => {
    if (!newTodo.trim()) return;
    
    const todo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now()
    };
    
    setTodos(prev => [todo, ...prev]);
    setNewTodo('');
  }, [newTodo]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  // 过滤显示的待办事项
  const displayTodos = settings.showCompleted 
    ? todos.slice(0, settings.maxItems)
    : todos.filter(t => !t.completed).slice(0, settings.maxItems);

  const completedCount = todos.filter(t => t.completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          待办事项
        </span>
        <span className="text-xs text-slate-400">
          {completedCount}/{todos.length}
        </span>
      </div>

      {/* 添加输入框 */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加新任务..."
          className="flex-1 px-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 
                     rounded-lg border-0 focus:ring-2 focus:ring-accent/50
                     placeholder:text-slate-400"
        />
        <button
          onClick={addTodo}
          disabled={!newTodo.trim()}
          className="p-1.5 rounded-lg bg-accent text-white 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 待办列表 */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
        {displayTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Check className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无待办</span>
          </div>
        ) : (
          displayTodos.map(todo => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-2 rounded-lg group
                         transition-all duration-200 cursor-pointer
                         ${todo.completed 
                           ? 'bg-slate-50 dark:bg-slate-800/50' 
                           : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                         }`}
              onClick={() => toggleTodo(todo.id)}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                              transition-colors duration-200
                              ${todo.completed 
                                ? 'bg-accent border-accent' 
                                : 'border-slate-300 dark:border-slate-600'
                              }`}
              >
                {todo.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              
              <span className={`flex-1 text-sm truncate
                              ${todo.completed 
                                ? 'text-slate-400 line-through' 
                                : 'text-slate-700 dark:text-slate-300'
                              }`}
              >
                {todo.text}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTodo(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded
                         hover:bg-red-100 dark:hover:bg-red-900/30
                         text-slate-400 hover:text-red-500
                         transition-all duration-200"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 底部统计 */}
      {todos.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>已完成 {completedCount} 项</span>
            {todos.filter(t => !t.completed).length > 0 && (
              <span>待完成 {todos.filter(t => !t.completed).length} 项</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoWidget;
