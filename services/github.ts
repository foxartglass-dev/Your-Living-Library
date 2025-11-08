interface RepoDetails {
    owner: string;
    repo: string;
}

export const parseRepoUrl = (url: string): RepoDetails | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') return null;
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) return null;
        const [owner, repo] = pathParts;
        return { owner, repo: repo.replace('.git', '') };
    } catch (e) {
        return null;
    }
}

interface GetRepoTreeParams {
    owner: string;
    repo: string;
    branch: string;
    token: string | null;
}

interface TreeEntry {
    path: string;
    type: 'blob' | 'tree';
    size?: number;
}

const MAX_FILES = 300;
const MAX_FILE_SIZE = 200 * 1024; // 200KB

const RELEVANT_PATTERNS = [
    /^package\.json$/,
    /^vite\.config\.(js|ts)$/,
    /^tsconfig\.json$/,
    /^README(\.md)?$/i,
    /\.env\.example$/,
    /^src\/.+\.(ts|tsx|js|jsx)$/,
    /^server\/.+/,
    /^app\/.+/,
    /^schema\/.+/,
];

export const filterRelevantFiles = (entries: TreeEntry[]): TreeEntry[] => {
    return entries
        .filter(entry =>
            entry.type === 'blob' &&
            entry.size !== undefined &&
            entry.size > 0 &&
            entry.size <= MAX_FILE_SIZE &&
            RELEVANT_PATTERNS.some(pattern => pattern.test(entry.path))
        )
        .slice(0, MAX_FILES);
};

const fetchWithAuth = async (url: string, token: string | null, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
};

export const getRepoTree = async ({ owner, repo, branch, token }: GetRepoTreeParams): Promise<TreeEntry[]> => {
    const branchesToTry = [branch, 'main', 'master'];
    let lastError: any = null;

    for (const b of branchesToTry) {
        if (!b) continue;
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`;
        try {
            const response = await fetchWithAuth(url, token);
            if (!response.ok) {
                if (response.status === 404) {
                    lastError = new Error(`Branch '${b}' not found.`);
                    continue; // Try next branch
                }
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data.truncated) {
                console.warn('Repository tree is truncated. Some files may be missing from the analysis.');
            }
            return data.tree;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('Failed to fetch repository tree for all attempted branches.');
};


interface FetchTextFileParams {
    owner: string;
    repo: string;
    branch: string;
    path: string;
    token: string | null;
}

export const fetchTextFile = async ({ owner, repo, branch, path, token }: FetchTextFileParams): Promise<string> => {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const response = await fetchWithAuth(url, token);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${path} (${response.status} ${response.statusText})`);
    }
    return response.text();
};
