import React, { useState, useEffect, useCallback } from 'react';
import { Project, GenerationState, CurrentState, RepoConfig } from './types';
import { LivingLibrary } from './components/LivingLibrary';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { IdeaTicker } from './components/IdeaTicker';
import { generateBlueprint } from './services/geminiService';
import { ChevronLeftIcon, CodeBracketSquareIcon, DocumentTextIcon } from './components/icons';
import { RepoPanel } from './components/RepoPanel';
import { CombinedOutput } from './components/CombinedOutput';

const GOLDEN_RULES = `THE GOLDEN RULES:
NO PLACEHOLDERS, EVER: All features must be fully implemented. UI controls must be wired to state and logic. Data flows must be complete. Do not use // TODO, // Implement later, or leave empty function bodies. If you write a function, you must also write its complete implementation.
EVERYTHING IS INTERACTIVE: The user must be able to click every button, enter text in every field, and see the application state change accordingly. All UI elements must be fully functional and wired up.
ASSUME PRODUCTION CONTEXT: Write clean, readable, and maintainable code. Use appropriate data structures, robust state management, and ensure a polished, responsive user experience.`;

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
        prompts: {
            orchestrator: {
                directive: GOLDEN_RULES,
                injection: 'start_end',
                includeState: true,
            }
        }
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
        prompts: {
            orchestrator: {
                directive: GOLDEN_RULES,
                injection: 'start_end',
                includeState: true,
            }
        }
    }
];


const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(() => {
        const savedProjects = localStorage.getItem('ideacraft_projects');
        if (savedProjects) {
            const parsedProjects = JSON.parse(savedProjects);
            // Backwards compatibility for projects saved before prompts existed
            return parsedProjects.map((p: Project) => ({
                ...p,
                prompts: p.prompts || {
                    orchestrator: {
                        directive: GOLDEN_RULES,
                        injection: 'start_end',
                        includeState: true,
                    }
                }
            }));
        }
        return initialProjects;
    });

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>({
        status: 'idle',
        stage: null,
        progress: 0,
        error: null,
    });
    const [isRepoPanelOpen, setIsRepoPanelOpen] = useState(false);
    const [isCombinedViewOpen, setIsCombinedViewOpen] = useState(false);

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
            prompts: {
                orchestrator: {
                    directive: GOLDEN_RULES,
                    injection: 'start_end',
                    includeState: true,
                }
            }
        };
        setProjects(prev => [newProject, ...prev]);
        setActiveProjectId(newProject.id);
    };

    const handleUpdateProject = useCallback((updatedProject: Project) => {
        setProjects(prevProjects =>
            prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
        );
    }, []);

    const handleRepoScanComplete = (repoConfig: RepoConfig, currentState: CurrentState) => {
        if (activeProjectId) {
            const projectToUpdate = projects.find(p => p.id === activeProjectId);
            if (projectToUpdate) {
                handleUpdateProject({
                    ...projectToUpdate,
                    repo: repoConfig,
                    current_state: currentState,
                });
            }
        }
        setIsRepoPanelOpen(false);
    };

    const composeFinalPrompt = (project: Project): string => {
        let finalPrompt = project.brainDump;

        const { orchestrator } = project.prompts!;
        
        if (orchestrator.includeState && project.current_state) {
            const stateMarkdown = `--- CURRENT STATE ---\n${project.current_state.markdown.substring(0, 1500)}...\n--- END CURRENT STATE ---\n\n`;
            finalPrompt = `${stateMarkdown}${finalPrompt}`;
        }
        
        if (!orchestrator.directive) return finalPrompt;

        switch (orchestrator.injection) {
            case 'start':
                return `${orchestrator.directive}\n\n${finalPrompt}`;
            case 'start_end':
                return `${orchestrator.directive}\n\n${finalPrompt}\n\n---\n\nREMINDER OF DIRECTIVE:\n${orchestrator.directive}`;
            case 'start_mid_end': {
                 const reminder = `\n\n---\nREMINDER: ADHERE TO DIRECTIVE\n---\n\n`;
                 if (finalPrompt.length > 2500) {
                     const mid = Math.floor(finalPrompt.length / 2);
                     const breakPoint = finalPrompt.indexOf('\n', mid);
                     const insertionPoint = breakPoint !== -1 ? breakPoint : mid;
                     const part1 = finalPrompt.substring(0, insertionPoint);
                     const part2 = finalPrompt.substring(insertionPoint);
                     finalPrompt = `${part1}${reminder}${part2}`;
                 }
                 return `${orchestrator.directive}\n\n${finalPrompt}\n\n---\n\nREMINDER OF DIRECTIVE:\n${orchestrator.directive}`;
            }
            default:
                return finalPrompt;
        }
    };

    const handleGenerateBlueprint = async (project: Project) => {
        setGenerationState({ status: 'generating', stage: 'Initializing...', progress: 5, error: null });
        try {
            const composedBrainDump = composeFinalPrompt(project);
            const projectForGeneration = { ...project, brainDump: composedBrainDump };

            const finalBlueprint = await generateBlueprint(projectForGeneration, (update) => {
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
                 <div className="fixed top-10 left-4 z-50 flex items-center gap-4">
                    <button onClick={handleBackToLibrary} className="bg-brand-surface/50 p-2 rounded-full hover:bg-brand-surface transition-colors backdrop-blur-sm">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                 </div>
            )}
             {activeProject && (
                <div className="fixed top-10 right-4 z-50 flex items-center gap-2">
                    <button onClick={() => setIsRepoPanelOpen(true)} className="bg-brand-surface/50 p-2 rounded-full hover:bg-brand-surface transition-colors backdrop-blur-sm" aria-label="Open Repository Scanner">
                        <CodeBracketSquareIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => setIsCombinedViewOpen(true)} className="bg-brand-surface/50 p-2 rounded-full hover:bg-brand-surface transition-colors backdrop-blur-sm" aria-label="Open Combined View">
                        <DocumentTextIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

            <main>
                {activeProject ? (
                    <ProjectWorkspace 
                        project={activeProject}
                        allProjects={projects}
                        onUpdateProject={handleUpdateProject}
                        onGenerateBlueprint={handleGenerateBlueprint}
                        generationState={generationState}
                        onJumpToCombined={() => setIsCombinedViewOpen(true)}
                    />
                ) : (
                    <LivingLibrary
                        projects={projects}
                        onSelectProject={handleSelectProject}
                        onCreateNewProject={handleCreateNewProject}
                    />
                )}
            </main>
            {isRepoPanelOpen && activeProject && (
                <RepoPanel 
                    project={activeProject} 
                    onClose={() => setIsRepoPanelOpen(false)}
                    onScanComplete={handleRepoScanComplete}
                />
            )}
             {isCombinedViewOpen && activeProject && (
                <CombinedOutput
                    project={activeProject}
                    onClose={() => setIsCombinedViewOpen(false)}
                    onViewSnapshot={() => {
                        setIsCombinedViewOpen(false);
                        setIsRepoPanelOpen(true);
                    }}
                />
            )}
        </div>
    );
};

export default App;
