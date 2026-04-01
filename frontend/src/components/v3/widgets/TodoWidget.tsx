import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

interface TodoWidgetProps {
  className?: string;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Refactor navigation system', completed: true, category: 'Development' },
    { id: '2', title: 'Finalize obsidian design system', completed: false, category: 'Design' },
    { id: '3', title: 'Review Q4 analytics report', completed: false, category: 'Business' },
    { id: '4', title: 'Prepare community update', completed: false, category: 'Marketing' },
  ]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Circular progress SVG
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Focus Tasks</h3>
          <p className="text-sm text-slate-400 mt-1">{completedCount} of {totalCount} completed today</p>
        </div>
        
        {/* Circular Progress */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="#242629"
              strokeWidth="3"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              task.completed 
                ? 'bg-[#0d0e10] opacity-60' 
                : 'bg-[#242629] hover:bg-[#2a2d31]'
            }`}
          >
            <button className="flex-shrink-0">
              {task.completed ? (
                <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#0d0e10]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-md border-2 border-slate-500" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                {task.title}
              </p>
              {!task.completed && (
                <p className="text-xs text-slate-500 mt-0.5">{task.category}</p>
              )}
            </div>

            {!task.completed && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.category === 'Development' ? 'bg-emerald-500/20 text-emerald-400' :
                task.category === 'Design' ? 'bg-blue-500/20 text-blue-400' :
                task.category === 'Business' ? 'bg-purple-500/20 text-purple-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {task.category}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <button className="w-full flex items-center justify-center gap-2 mt-4 py-3 text-emerald-400 hover:text-emerald-300 transition-colors">
        <span className="text-sm font-medium">View All Tasks</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TodoWidget;
