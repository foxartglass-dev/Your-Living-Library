
export interface Doc {
  id: string;
  url: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  userStory?: string;
  acceptanceCriteria?: string;
}

export interface BlueprintSection {
  id: string;
  title: string;
  backlog: BacklogItem[];
}

export interface Blueprint {
  sections: BlueprintSection[];
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  tags: string[];
  brainDump: string;
  docs: Doc[];
  blueprint: Blueprint | null;
  createdAt: string;
}

export interface GenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  stage: string | null;
  progress: number;
  error: string | null;
}
