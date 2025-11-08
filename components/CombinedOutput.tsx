import React, { useMemo } from 'react';
import { Project } from '../types';
import { XMarkIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from './icons';
import { downloadText } from '../utils/export';

interface CombinedOutputProps {
    project: Project;
    onClose: () => void;
    onViewSnapshot: () => void;
}

const formatBlueprintToMarkdown = (project: Project): string => {
    let md = `# Blueprint: ${project.name}\n\n`;
    md += `> ${project.tagline}\n\n`;

    md += `## Brain Dump\n\n${project.brainDump}\n\n`;

    if (project.current_state) {
        md += `## Current State Snapshot\n\n`;
        md += `*(Captured at: ${new Date(project.current_state.captured_at).toLocaleString()})*\n\n`;
        md += '```\n';
        md += project.current_state.markdown.substring(0, 1000) + (project.current_state.markdown.length > 1000 ? '...' : '');
        md += '\n```\n\n';
    }

    if (project.blueprint) {
        md += `## Generated Blueprint\n\n`;
        project.blueprint.sections.forEach(section => {
            md += `### ${section.title}\n\n`;
            section.backlog.forEach(item => {
                md += `#### ${item.title}\n\n`;
                md += `**User Story:** ${item.userStory}\n\n`;
                md += `**Acceptance Criteria:**\n${item.acceptanceCriteria?.split('\n').map(line => `- ${line}`).join('\n')}\n\n`;
            });
        });
    }

    return md;
}

const formatBlueprintToJson = (project: Project): string => {
    // Exclude volatile or large fields for a cleaner export
    const { current_state, ...exportableProject } = project;
    return JSON.stringify(exportableProject, null, 2);
}


export const CombinedOutput: React.FC<CombinedOutputProps> = ({ project, onClose, onViewSnapshot }) => {
    const combinedMarkdown = useMemo(() => formatBlueprintToMarkdown(project), [project]);
    const combinedJson = useMemo(() => formatBlueprintToJson(project), [project]);

    const handleCopy = () => {
        navigator.clipboard.writeText(combinedMarkdown);
    };

    const handleDownloadMd = () => {
        downloadText(combinedMarkdown, `${project.name.replace(/\s/g, '_')}_blueprint.md`, 'text/markdown');
    };
    
    const handleDownloadJson = () => {
        downloadText(combinedJson, `${project.name.replace(/\s/g, '_')}_project.json`, 'application/json');
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/50 backdrop-blur-sm z-[60] animate-fade-in" aria-modal="true">
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-brand-surface border-l border-brand-border shadow-2xl flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-brand-border flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Combined View</h2>
                        <p className="text-sm text-brand-text-secondary">{project.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-border">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-4 border-b border-brand-border flex-shrink-0 flex items-center gap-2 flex-wrap">
                    <button onClick={handleCopy} className="flex items-center gap-2 bg-brand-bg text-sm font-semibold py-2 px-3 rounded-md border border-brand-border hover:bg-brand-border transition-colors">
                        <DocumentDuplicateIcon className="w-4 h-4" /> Copy All
                    </button>
                    <button onClick={handleDownloadMd} className="flex items-center gap-2 bg-brand-bg text-sm font-semibold py-2 px-3 rounded-md border border-brand-border hover:bg-brand-border transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Download .md
                    </button>
                    <button onClick={handleDownloadJson} className="flex items-center gap-2 bg-brand-bg text-sm font-semibold py-2 px-3 rounded-md border border-brand-border hover:bg-brand-border transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Download .json
                    </button>
                     {project.current_state && (
                        <button onClick={onViewSnapshot} className="flex items-center gap-2 bg-brand-bg text-sm font-semibold py-2 px-3 rounded-md border border-brand-border hover:bg-brand-border transition-colors ml-auto">
                           <ArrowTopRightOnSquareIcon className="w-4 h-4" /> View Full Snapshot
                        </button>
                     )}
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    <pre className="text-sm text-brand-text-secondary whitespace-pre-wrap font-sans bg-brand-bg p-4 rounded-lg border border-brand-border">{combinedMarkdown}</pre>
                </div>
            </div>
        </div>
    );
};
