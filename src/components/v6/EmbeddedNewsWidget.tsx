// News Widget Component - Embeds news.678870.xyz
import React from 'react';

export const EmbeddedNewsWidget: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px] bg-[#0d0e10] rounded-lg overflow-hidden">
      <iframe
        src="https://news.678870.xyz/"
        className="w-full h-full min-h-[400px] border-0"
        title="News Feed"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
};
