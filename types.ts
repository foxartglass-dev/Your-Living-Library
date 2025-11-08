export interface Doc {
  id: string;
  url: string;
}

export interface BacklogItem {
  id:string;
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

export interface RepoConfig {
  url: string;
  owner: string;
  repo: string;
  branch: string;
  authMode: "public" | "pat_browser";
}

export interface CurrentState {
  markdown: string;
  json: {
    stack: { dependencies: Record<string, string>, devDependencies: Record<string, string> };
    modules: string[];
    routes: string[];
    apis: string[];
    models: string[];
    env: string[];
    features_present: string[];
    gaps: string[];
    notes?: string;
  };
  captured_at: string;
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

  // New fields for repo scanning and prompt engineering
  repo?: RepoConfig;
  current_state?: CurrentState;
  prompts?: {
    orchestrator: {
      directive: string;
      injection: "start" | "start_end" | "start_mid_end";
      includeState: boolean;
    }
  };
}

export interface GenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  stage: string | null;
  progress: number;
  error: string | null;
}
