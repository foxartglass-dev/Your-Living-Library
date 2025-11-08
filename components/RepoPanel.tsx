import React, { useState, useEffect, useCallback } from 'react';
import { Project, RepoConfig, CurrentState } from '../types';
import { XMarkIcon, ServerStackIcon } from './icons';
import { parseRepoUrl } from '../services/github';
import { buildCurrentStateSummary } from '../services/currentState';

const GITHUB_PAT_KEY = 'gh.pat';
const QUICK_TEST_URL = 'https://github.com/tastejs/todomvc';

interface RepoPanelProps {
    project: Project;
    onClose: () => void;
    onScanComplete: (repoConfig: RepoConfig, currentState: CurrentState) => void;
}

export const RepoPanel: React.FC<RepoPanelProps> = ({ project, onClose, onScanComplete }) => {
    const [repoUrl, setRepoUrl] = useState(project.repo?.url || '');
    const [branch, setBranch] = useState(project.repo?.branch || 'main');
    const [authMode, setAuthMode] = useState<'public' | 'pat_browser'>(project.repo?.authMode || 'public');
    const [pat, setPat] = useState('');
    const [isPatStored, setIsPatStored] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedPat = localStorage.getItem(GITHUB_PAT_KEY);
        if (storedPat) {
            setIsPatStored(true);
        }
    }, []);

    const handleSaveToken = () => {
        if (pat.trim()) {
            localStorage.setItem(GITHUB_PAT_KEY, pat);
            setIsPatStored(true);
            setPat('');
        }
    };

    const handleRemoveToken = () => {
        localStorage.removeItem(GITHUB_PAT_KEY);
        setIsPatStored(false);
    };

    const handleQuickTest = () => {
        setRepoUrl(QUICK_TEST_URL);
        setBranch('master');
        setAuthMode('public');
    };

    const handleScan = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const parsed = parseRepoUrl(repoUrl);
            if (!parsed) {
                throw new Error("Invalid GitHub URL format. Expected format: https://github.com/owner/repo");
            }
            const { owner, repo } = parsed;
            const token = authMode === 'pat_browser' ? localStorage.getItem(GITHUB_PAT_KEY) : undefined;

            if (authMode === 'pat_browser' && !token) {
                throw new Error("Private mode selected, but no Personal Access Token is stored.");
            }

            const repoConfig: RepoConfig = { url: repoUrl, owner, repo, branch, authMode };
            const currentState = await buildCurrentStateSummary({ ...repoConfig, token: token || null });
            
            onScanComplete(repoConfig, currentState);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/50 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" aria-modal="true">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <header className="p-4 flex justify-between items-center border-b border-brand-border flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2"><ServerStackIcon /> Repository Scanner</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-border"><XMarkIcon className="w-6 h-6" /></button>
                </header>
                
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    {isPatStored && authMode === 'pat_browser' && (
                        <div className="p-3 bg-red-900/50 border border-red-500/30 rounded-md text-center text-sm">
                            PAT stored in browser (localStorage). <button onClick={handleRemoveToken} className="underline hover:text-white">Remove after use.</button>
                        </div>
                    )}

                    <div>
                        <label htmlFor="repo-url" className="block text-sm font-medium text-brand-text-primary mb-1">Repository URL</label>
                        <div className="flex gap-2">
                        <input id="repo-url" type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="flex-grow bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        <button onClick={handleQuickTest} className="bg-brand-border text-sm font-semibold py-2 px-3 rounded-md hover:bg-brand-primary/20 transition-colors">Quick Test</button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-brand-text-primary mb-1">Branch</label>
                        <input id="branch" type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text-primary mb-2">Auth Mode</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="auth" value="public" checked={authMode === 'public'} onChange={() => setAuthMode('public')} className="accent-brand-primary" /> Public</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="auth" value="pat_browser" checked={authMode === 'pat_browser'} onChange={() => setAuthMode('pat_browser')} className="accent-brand-primary" /> Private (via PAT)</label>
                        </div>
                    </div>

                    {authMode === 'pat_browser' && !isPatStored && (
                         <div>
                            <label htmlFor="pat" className="block text-sm font-medium text-brand-text-primary mb-1">Personal Access Token</label>
                            <div className="flex gap-2">
                                <input id="pat" type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="ghp_..." className="flex-grow bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                <button onClick={handleSaveToken} disabled={!pat.trim()} className="bg-brand-primary text-sm font-semibold py-2 px-3 rounded-md hover:bg-brand-primary/80 disabled:opacity-50 transition-colors">Save Token</button>
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md">{error}</p>}
                    
                    {project.current_state && (
                        <div className="border-t border-brand-border pt-4">
                            <h3 className="font-bold mb-2">Current Snapshot</h3>
                            <div className="bg-brand-bg p-4 rounded-md border border-brand-border max-h-48 overflow-y-auto">
                                <pre className="text-xs text-brand-text-secondary whitespace-pre-wrap font-sans">{project.current_state.markdown}</pre>
                            </div>
                            <p className="text-xs text-brand-text-secondary mt-1 text-right">Captured at {new Date(project.current_state.captured_at).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-brand-border flex-shrink-0 flex justify-end">
                    <button 
                        onClick={handleScan} 
                        disabled={isLoading || !repoUrl}
                        className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-transform duration-300"
                    >
                        {isLoading ? 'Scanning...' : project.current_state ? 'Rescan Repo' : 'Scan Repo'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
