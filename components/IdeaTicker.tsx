
import React from 'react';
import { Project } from '../types';

interface IdeaTickerProps {
  projects: Project[];
}

export const IdeaTicker: React.FC<IdeaTickerProps> = ({ projects }) => {
  if (!projects.length) {
    return null;
  }

  const tickerContent = projects.map(p => p.name).join('  •  ');

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-brand-surface border-b border-brand-border z-50 overflow-hidden whitespace-nowrap">
      <div className="absolute top-0 left-0 h-full flex items-center animate-ticker">
        <span className="text-brand-text-secondary font-semibold px-4">{tickerContent}</span>
        <span className="text-brand-text-secondary font-semibold px-4">{tickerContent}</span>
      </div>
    </div>
  );
};
