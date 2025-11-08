
import React, { useState, useEffect, useCallback } from 'react';
import { Project, GenerationState } from './types';
import { LivingLibrary } from './components/LivingLibrary';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { IdeaTicker } from './components/IdeaTicker';
import { generateBlueprint } from './services/geminiService';
import { ChevronLeftIcon } from './components/icons';


const initialProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'AI-Powered Recipe Generator',
        tagline: 'Discover new meals based on ingredients you already have.',
        tags: ['AI', 'FoodTech', 'Mobile App'],
        brainDump: `I want to build an app that helps people figure out what to cook. Users can input a list of ingredients they have in their fridge or pantry, and the app uses AI to suggest recipes. It should also consider dietary restrictions like vegan, gluten-free, etc. The UI should be super simple and visual. Maybe it can also generate a shopping list for missing ingredients for a chosen recipe. Core tech stack should be React Native for mobile, Supabase for the backend, and Google Gemini for the AI part.`,
        docs: [
            { id: 'doc-1', url: 'https://reactnative.dev/docs/getting-started' },
            { id: 'doc-2', url: 'https://supabase.com/docs' },
        ],
        blueprint: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'proj-2',
        name: 'Personal Finance Dashboard',
        tagline: 'A privacy-first dashboard to track your investments and budgets.',
        tags: ['FinTech', 'Data Viz', 'Web App'],
        brainDump: `A web application to visualize personal finances. Connects to various bank accounts and investment platforms using Plaid API. The main feature is a highly customizable dashboard with widgets for net worth, budget tracking, investment performance, and upcoming bills. Security and privacy are paramount. No user data should be sold. The app should be built with React, TypeScript, and maybe use Recharts for the charts.`,
        docs: [
             { id: 'doc-3', url: 'https://plaid.com/docs/' },
             { id: 'doc-4', url: 'https://recharts.org/en-US/api' },
        ],
        blueprint: null,
        createdAt: new Date().toISOString(),
    }
];


const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(() => {
        const savedProjects = localStorage.getItem('ideacraft_projects');
        return savedProjects ? JSON.parse(savedProjects) : initialProjects;
    });
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>({
        status: 'idle',
        stage: null,
        progress: 0,
        error: null,
    });

    useEffect(() => {
        localStorage.setItem('ideacraft_projects', JSON.stringify(projects));
    }, [projects]);

    const handleSelectProject = (id: string) => {
        setActiveProjectId(id);
        setGenerationState({ status: 'idle', stage: null, progress: 0, error: null });
    };

    const handleBackToLibrary = () => {
        setActiveProjectId(null);
    };

    const handleCreateNewProject = () => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: 'Untitled Project',
            tagline: 'A new idea waiting to be forged.',
            tags: ['New'],
            brainDump: '',
            docs: [],
            blueprint: null,
            createdAt: new Date().toISOString(),
        };
        setProjects(prev => [newProject, ...prev]);
        setActiveProjectId(newProject.id);
    };

    const handleUpdateProject = useCallback((updatedProject: Project) => {
        setProjects(prevProjects =>
            prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
        );
    }, []);

    const handleGenerateBlueprint = async (project: Project) => {
        setGenerationState({ status: 'generating', stage: 'Initializing...', progress: 5, error: null });
        try {
            const finalBlueprint = await generateBlueprint(project, (update) => {
                setGenerationState(prev => ({ ...prev, stage: update.stage, progress: update.progress }));
                if(update.data?.sections) {
                    const partialBlueprint = { sections: update.data.sections };
                    handleUpdateProject({ ...project, blueprint: partialBlueprint });
                }
            });
            handleUpdateProject({ ...project, blueprint: finalBlueprint });
            setGenerationState({ status: 'success', stage: 'Completed', progress: 100, error: null });
        } catch (error) {
            console.error("Blueprint generation failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setGenerationState({ status: 'error', stage: 'Failed', progress: 0, error: errorMessage });
        }
    };

    const activeProject = projects.find(p => p.id === activeProjectId);

    return (
        <div className="relative min-h-screen">
            <IdeaTicker projects={projects} />
            {activeProject && (
                 <button onClick={handleBackToLibrary} className="fixed top-10 left-4 z-50 bg-brand-surface/50 p-2 rounded-full hover:bg-brand-surface transition-colors backdrop-blur-sm">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <main>
                {activeProject ? (
                    <ProjectWorkspace 
                        project={activeProject}
                        allProjects={projects}
                        onUpdateProject={handleUpdateProject}
                        onGenerateBlueprint={handleGenerateBlueprint}
                        generationState={generationState}
                    />
                ) : (
                    <LivingLibrary
                        projects={projects}
                        onSelectProject={handleSelectProject}
                        onCreateNewProject={handleCreateNewProject}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
