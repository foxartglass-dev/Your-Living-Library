
import { GoogleGenAI, Type } from "@google/genai";
import { Project, BlueprintSection, BacklogItem, Blueprint } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models;

const safeJSONParse = <T,>(text: string): T | null => {
  try {
    // Clean the text: remove markdown backticks and "json" label
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    console.error("Original text:", text);
    return null;
  }
};

export const generateFeatureSuggestions = async (project: Project): Promise<string[]> => {
  try {
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this project brief and suggest 3 innovative but relevant new features. Keep suggestions concise (under 15 words each).
      Project Name: ${project.name}
      Tagline: ${project.tagline}
      Brain Dump: ${project.brainDump}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
        temperature: 0.8,
      }
    });
    const parsed = safeJSONParse<{ suggestions: string[] }>(response.text);
    return parsed?.suggestions || [];
  } catch (error) {
    console.error("Error generating feature suggestions:", error);
    return [];
  }
};

type ProgressCallback = (update: { stage: string; progress: number, data?: any }) => void;

export const generateBlueprint = async (project: Project, callback: ProgressCallback): Promise<Blueprint> => {
    const { brainDump, docs } = project;
    const docUrls = docs.map(d => d.url).join(', ');
    const fullContext = `
      PROJECT CONTEXT:
      Name: ${project.name}
      Brain Dump: ${brainDump}
      Referenced Tech/Docs: ${docUrls || 'None'}
      
      IMPORTANT: You are building a detailed product blueprint. Be specific, actionable, and avoid placeholders. All generated text should be ready for a developer to implement. The acceptance criteria should be a newline-separated string.
    `;
    
    // Stage 1: Generate Sections
    callback({ stage: "Generating high-level sections...", progress: 10 });
    const sectionsResponse = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${fullContext}\n\nBased on the context, identify the main sections or epics of this project. Return a JSON object with a "sections" key containing an array of strings.`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { sections: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
    });
    const sectionsParsed = safeJSONParse<{ sections: string[] }>(sectionsResponse.text);
    if (!sectionsParsed || !sectionsParsed.sections || sectionsParsed.sections.length === 0) throw new Error("Failed to generate project sections.");
    
    const blueprintSections: BlueprintSection[] = sectionsParsed.sections.map(title => ({ id: crypto.randomUUID(), title, backlog: [] }));
    callback({ stage: "Sections generated. Moving to backlog generation...", progress: 25, data: { sections: blueprintSections } });

    // Stage 2: Generate backlog for each section
    let totalProgress = 25;
    const progressIncrement = 75 / blueprintSections.length;

    const backlogSchema = {
        type: Type.OBJECT,
        properties: {
            backlogItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A concise, descriptive title for the user story." },
                        userStory: { type: Type.STRING, description: "The user story in the format: 'As a [user type], I want [an action] so that [a benefit]'." },
                        acceptanceCriteria: { type: Type.STRING, description: "A newline-separated string of specific, testable acceptance criteria." }
                    },
                    required: ['title', 'userStory', 'acceptanceCriteria']
                }
            }
        },
        required: ['backlogItems']
    };

    for (let i = 0; i < blueprintSections.length; i++) {
        const section = blueprintSections[i];
        
        callback({ stage: `Generating backlog for "${section.title}"...`, progress: totalProgress });
        
        const backlogResponse = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${fullContext}\n\nFor the "${section.title}" section, generate a list of detailed backlog items. For each item, provide a title, a user story, and acceptance criteria. Return a JSON object with a "backlogItems" key containing an array of these items.`,
            config: { responseMimeType: "application/json", responseSchema: backlogSchema }
        });

        const backlogParsed = safeJSONParse<{ backlogItems: Omit<BacklogItem, 'id'>[] }>(backlogResponse.text);

        if (backlogParsed && backlogParsed.backlogItems) {
            blueprintSections[i].backlog = backlogParsed.backlogItems.map(item => ({
                id: crypto.randomUUID(),
                ...item,
            }));
        }
        
        totalProgress = Math.min(100, totalProgress + progressIncrement);
        callback({ stage: `Completed section "${section.title}".`, progress: totalProgress, data: { sections: blueprintSections } });

        // Add a small delay between API calls to respect rate limits
        if (i < blueprintSections.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return { sections: blueprintSections };
};
