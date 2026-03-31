import React from 'react';
import { Cloud, Zap, Newspaper, CheckCircle2, ExternalLink } from 'lucide-react';

interface DashboardProps {
  widgets: React.ReactNode;
  pinnedResources: Array<{
    id: string;
    name: string;
    icon: string;
    url: string;
    color: string;
  }>;
  onResourceClick: (url: string) => void;
  onAddResource: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  widgets,
  pinnedResources,
  onResourceClick,
  onAddResource,
  viewMode = 'grid',
  onViewModeChange
}) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'mail': return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case 'globe': return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
      case 'play': return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Widgets Section */}
      <section>
        {widgets}
      </section>

      {/* Pinned Resources Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Pinned Resources</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange?.('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange?.('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8' : 'grid-cols-1'}`}>
          {pinnedResources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => onResourceClick(resource.url)}
              className={`
                group flex ${viewMode === 'grid' ? 'flex-col items-center gap-3 p-4' : 'flex-row items-center gap-4 p-3'}
                rounded-2xl bg-[#1e2127] border border-white/5 
                hover:border-emerald-500/30 hover:bg-[#252a32] 
                transition-all duration-200 active:scale-95
              `}
            >
              <div 
                className={`
                  ${viewMode === 'grid' ? 'w-12 h-12' : 'w-10 h-10'} 
                  rounded-xl flex items-center justify-center
                  transition-transform duration-200 group-hover:scale-110
                `}
                style={{ backgroundColor: resource.color }}
              >
                {getIconComponent(resource.icon)}
              </div>
              <span className={`text-sm font-medium text-slate-300 group-hover:text-white ${viewMode === 'list' ? 'flex-1 text-left' : ''}`}>
                {resource.name}
              </span>
              {viewMode === 'list' && (
                <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
          
          {/* Add New Button */}
          <button
            onClick={onAddResource}
            className={`
              group flex ${viewMode === 'grid' ? 'flex-col items-center gap-3 p-4' : 'flex-row items-center gap-4 p-3'}
              rounded-2xl bg-[#1e2127]/50 border border-dashed border-white/10 
              hover:border-emerald-500/30 hover:bg-[#1e2127]
              transition-all duration-200 active:scale-95
            `}
          >
            <div className={`
              ${viewMode === 'grid' ? 'w-12 h-12' : 'w-10 h-10'} 
              rounded-xl flex items-center justify-center bg-slate-800
              group-hover:bg-emerald-500/20 transition-colors
            `}>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className={`text-sm font-medium text-slate-400 group-hover:text-emerald-400 ${viewMode === 'list' ? 'flex-1 text-left' : ''}`}>
              {viewMode === 'grid' ? 'Pin New' : 'Add Pinned Resource'}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
