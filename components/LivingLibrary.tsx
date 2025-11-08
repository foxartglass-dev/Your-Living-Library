
import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import { generateFeatureSuggestions } from '../services/geminiService';
import { PlusIcon, SparklesIcon, LightBulbIcon } from './icons';

interface LivingLibraryProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  isProductiveWait?: boolean;
}

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => (
  <div
    className="bg-brand-surface p-6 rounded-lg border border-brand-border hover:border-brand-primary transition-all duration-300 cursor-pointer flex flex-col justify-between h-full animate-fade-in"
    onClick={onSelect}
  >
    <div>
      <h3 className="text-xl font-bold text-brand-text-primary mb-2">{project.name}</h3>
      <p className="text-brand-text-secondary mb-4 text-sm">{project.tagline}</p>
    </div>
    <div className="flex flex-wrap gap-2 mt-auto">
      {project.tags.slice(0, 3).map(tag => (
        <span key={tag} className="bg-brand-bg text-brand-text-secondary text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
      ))}
    </div>
  </div>
);

const SpotlightCard: React.FC<{ project: Project, onNext: () => void, onExplore: () => void }> = ({ project, onNext, onExplore }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getSuggestions = async () => {
            setIsLoading(true);
            const newSuggestions = await generateFeatureSuggestions(project);
            setSuggestions(newSuggestions);
            setIsLoading(false);
        };
        getSuggestions();
    }, [project]);

    return (
        <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 p-6 rounded-xl border-2 border-brand-primary animate-pulse-glow col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-brand-text-primary">Idea Spotlight</h2>
                    <p className="text-brand-text-secondary">AI-powered inspiration for your projects.</p>
                </div>
                <SparklesIcon className="w-8 h-8 text-brand-primary" />
            </div>
            
            <div className="bg-brand-surface/50 p-4 rounded-lg mb-4">
                <h3 className="text-xl font-bold">{project.name}</h3>
                <p className="text-brand-text-secondary text-sm">{project.tagline}</p>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><LightBulbIcon className="w-5 h-5 text-yellow-400" /> AI Feature Catalyst:</h4>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-brand-surface/50 rounded-md animate-pulse"></div>)}
                    </div>
                ) : (
                    <ul className="list-disc list-inside space-y-2 text-brand-text-secondary">
                        {suggestions.map((s, i) => <li key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>{s}</li>)}
                    </ul>
                )}
            </div>

            <div className="flex gap-4 mt-6">
                <button onClick={onExplore} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-primary/80 transition-colors">Explore Project</button>
                <button onClick={onNext} className="bg-brand-surface text-brand-text-primary font-semibold py-2 px-4 rounded-lg border border-brand-border hover:bg-brand-border transition-colors">Next Idea</button>
            </div>
        </div>
    );
}


export const LivingLibrary: React.FC<LivingLibraryProps> = ({ projects, onSelectProject, onCreateNewProject, isProductiveWait = false }) => {
    const [spotlightIndex, setSpotlightIndex] = useState(0);

    useEffect(() => {
      if (projects.length > 0) {
        setSpotlightIndex(Math.floor(Math.random() * projects.length));
      }
    }, [projects.length]);

    const handleNextSpotlight = useCallback(() => {
        setSpotlightIndex(prev => (prev + 1) % projects.length);
    }, [projects.length]);

    const spotlightProject = projects.length > 0 ? projects[spotlightIndex] : null;

    if(isProductiveWait) {
      return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-2">While The Forge is working...</h2>
          <p className="text-brand-text-secondary text-center mb-8">Let's revisit some of your other ideas.</p>
          {spotlightProject && <SpotlightCard project={spotlightProject} onNext={handleNextSpotlight} onExplore={() => {}} />}
        </div>
      );
    }
    
    return (
        <div className="min-h-screen w-full pt-16 pb-8">
            <div className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-brand-text-primary">Your Living Library</h1>
                    <p className="text-lg text-brand-text-secondary mt-2">Where your brilliant ideas live, breathe, and evolve.</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spotlightProject && (
                        <SpotlightCard project={spotlightProject} onNext={handleNextSpotlight} onExplore={() => onSelectProject(spotlightProject.id)} />
                    )}

                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} onSelect={() => onSelectProject(project.id)} />
                    ))}

                    <div
                        onClick={onCreateNewProject}
                        className="bg-brand-surface/50 p-6 rounded-lg border-2 border-dashed border-brand-border hover:border-brand-primary hover:bg-brand-surface transition-all duration-300 cursor-pointer flex flex-col justify-center items-center text-brand-text-secondary hover:text-brand-text-primary min-h-[250px]"
                    >
                        <PlusIcon className="w-12 h-12 mb-4" />
                        <span className="text-lg font-semibold">Create New Project</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
