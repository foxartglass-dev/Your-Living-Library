
import React, { useState, useCallback } from 'react';
import { Project, Doc, GenerationState } from '../types';
import { BookOpenIcon, PlusIcon, SparklesIcon, TrashIcon, CheckCircleIcon, WandIcon } from './icons';
import { BlueprintDisplay } from './BlueprintDisplay';
import { LivingLibrary } from './LivingLibrary';

interface DocsHubProps {
  docs: Doc[];
  onAddDoc: (url: string) => void;
  onRemoveDoc: (id: string) => void;
}

const DocsHub: React.FC<DocsHubProps> = ({ docs, onAddDoc, onRemoveDoc }) => {
  const [newDocUrl, setNewDocUrl] = useState('');

  const handleAdd = () => {
    if (newDocUrl.trim() && URL.canParse(newDocUrl.trim())) {
      onAddDoc(newDocUrl.trim());
      setNewDocUrl('');
    }
  };

  return (
    <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><BookOpenIcon /> Documentation Hub</h3>
      <p className="text-brand-text-secondary mb-4 text-sm">Ground the AI in reality by providing links to relevant tech docs. The AI will use its knowledge of these technologies to create a more accurate blueprint.</p>
      <div className="flex gap-2 mb-4">
        <input
          type="url"
          value={newDocUrl}
          onChange={(e) => setNewDocUrl(e.target.value)}
          placeholder="https://example.com/docs"
          className="flex-grow bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
        <button onClick={handleAdd} className="bg-brand-primary p-2 rounded-md hover:bg-brand-primary/80 transition-colors"><PlusIcon /></button>
      </div>
      <ul className="space-y-2">
        {docs.map(doc => (
          <li key={doc.id} className="flex justify-between items-center bg-brand-bg p-2 rounded-md text-sm">
            <span className="text-brand-text-secondary truncate">{doc.url}</span>
            <button onClick={() => onRemoveDoc(doc.id)} className="text-brand-text-secondary hover:text-brand-accent p-1"><TrashIcon className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const GenerationProgress: React.FC<{ generationState: GenerationState }> = ({ generationState }) => {
    if (generationState.status === 'idle') return null;

    if (generationState.status === 'success') {
        return (
            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center animate-fade-in">
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-400">Blueprint Forged!</h3>
                <p className="text-brand-text-secondary">Your idea has been successfully structured.</p>
            </div>
        )
    }

    if (generationState.status === 'error') {
        return (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center animate-fade-in">
                 <h3 className="text-xl font-bold text-red-400">Generation Failed</h3>
                 <p className="text-brand-text-secondary">{generationState.error}</p>
            </div>
        )
    }

    return (
        <div className="mt-8 p-6 bg-brand-surface border border-brand-border rounded-lg animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-4">
                <WandIcon className="w-6 h-6 text-brand-primary animate-pulse" />
                <h3 className="text-xl font-bold text-brand-text-primary">The Forge is Active...</h3>
            </div>
            <p className="text-center text-brand-text-secondary mb-4">{generationState.stage}</p>
            <div className="w-full bg-brand-bg rounded-full h-2.5">
                <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${generationState.progress}%` }}></div>
            </div>
        </div>
    );
};


interface ProjectWorkspaceProps {
  project: Project;
  allProjects: Project[];
  onUpdateProject: (updatedProject: Project) => void;
  onGenerateBlueprint: (project: Project) => void;
  generationState: GenerationState;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, allProjects, onUpdateProject, onGenerateBlueprint, generationState }) => {
  
  const handleBrainDumpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateProject({ ...project, brainDump: e.target.value });
  };
  
  const handleAddDoc = useCallback((url: string) => {
    const newDoc: Doc = { id: crypto.randomUUID(), url };
    onUpdateProject({ ...project, docs: [...project.docs, newDoc] });
  }, [project, onUpdateProject]);

  const handleRemoveDoc = useCallback((id: string) => {
    onUpdateProject({ ...project, docs: project.docs.filter(d => d.id !== id) });
  }, [project, onUpdateProject]);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 pt-16 animate-fade-in">
        <header className="mb-8">
            <h1 className="text-4xl font-extrabold text-brand-text-primary">{project.name}</h1>
            <p className="text-lg text-brand-text-secondary">{project.tagline}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Brain Dump</h2>
                <textarea
                    value={project.brainDump}
                    onChange={handleBrainDumpChange}
                    placeholder="Pour your raw, unstructured ideas here..."
                    className="w-full h-64 bg-brand-surface border border-brand-border rounded-lg p-4 focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
                />
            </div>
            <div className="space-y-6">
                 <DocsHub docs={project.docs} onAddDoc={handleAddDoc} onRemoveDoc={handleRemoveDoc} />
            </div>
        </div>
        
        <div className="mt-12 text-center">
            <button
                onClick={() => onGenerateBlueprint(project)}
                disabled={generationState.status === 'generating' || !project.brainDump.trim()}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-transform duration-300 flex items-center gap-2 mx-auto"
            >
                <SparklesIcon />
                {generationState.status === 'generating' ? 'Generating...' : 'Forge Blueprint'}
            </button>
        </div>

        <GenerationProgress generationState={generationState} />

        {generationState.status === 'generating' && (
            <div className="mt-12">
                <LivingLibrary projects={allProjects} onSelectProject={() => {}} onCreateNewProject={() => {}} isProductiveWait={true} />
            </div>
        )}
        
        {project.blueprint && <BlueprintDisplay blueprint={project.blueprint} />}
    </div>
  );
};
