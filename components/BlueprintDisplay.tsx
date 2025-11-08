
import React, { useState } from 'react';
import { Blueprint } from '../types';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left font-bold text-lg bg-brand-surface/50 hover:bg-brand-border/50 transition-colors flex justify-between items-center"
            >
                {title}
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.9201 8.9502L13.4001 15.4702C12.6301 16.2402 11.3701 16.2402 10.6001 15.4702L4.08008 8.9502" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
            </button>
            {isOpen && (
                <div className="p-4 md:p-6 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export const BlueprintDisplay: React.FC<{ blueprint: Blueprint }> = ({ blueprint }) => {
    return (
        <div className="mt-8">
            <h2 className="text-3xl font-bold mb-6 text-brand-text-primary">Generated Blueprint</h2>
            {blueprint.sections.map(section => (
                <CollapsibleSection key={section.id} title={section.title}>
                    {section.backlog.map(item => (
                        <div key={item.id} className="mb-6 p-4 border-l-4 border-brand-primary bg-brand-bg rounded-r-lg">
                            <h4 className="font-semibold text-lg text-brand-text-primary mb-2">{item.title}</h4>
                            <div className="pl-4">
                                <p className="text-brand-text-secondary mb-2 whitespace-pre-wrap"><strong className="text-brand-text-primary">User Story:</strong> {item.userStory}</p>
                                <p className="text-brand-text-secondary whitespace-pre-wrap"><strong className="text-brand-text-primary">Acceptance Criteria:</strong>{`\n`}{item.acceptanceCriteria}</p>
                            </div>
                        </div>
                    ))}
                </CollapsibleSection>
            ))}
        </div>
    );
};
