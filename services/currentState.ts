import { getRepoTree, fetchTextFile, filterRelevantFiles } from './github';
import { CurrentState, RepoConfig } from '../types';

interface BuildStateParams extends RepoConfig {
    token: string | null;
}

const analyzePackageJson = (content: string): { dependencies: Record<string, string>, devDependencies: Record<string, string> } => {
    try {
        const pkg = JSON.parse(content);
        return {
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {},
        };
    } catch {
        return { dependencies: {}, devDependencies: {} };
    }
};

export const buildCurrentStateSummary = async (params: BuildStateParams): Promise<CurrentState> => {
    const tree = await getRepoTree(params);
    const relevantFiles = filterRelevantFiles(tree);

    let markdown = '### Heuristic Repository Analysis\n\n';
    const json: CurrentState['json'] = {
        stack: { dependencies: {}, devDependencies: {} },
        modules: [],
        routes: [],
        apis: [],
        models: [],
        env: [],
        features_present: [],
        gaps: [],
        notes: "This is a heuristic-based summary and may not be exhaustive."
    };

    // 1. Analyze package.json for stack info
    const packageJsonFile = relevantFiles.find(f => f.path === 'package.json');
    if (packageJsonFile) {
        const content = await fetchTextFile({ ...params, path: 'package.json' });
        const stackInfo = analyzePackageJson(content);
        json.stack = stackInfo;
        markdown += '#### Tech Stack (from package.json):\n';
        markdown += `- Dependencies: ${Object.keys(stackInfo.dependencies).slice(0, 5).join(', ')}...\n`;
        markdown += `- Dev Dependencies: ${Object.keys(stackInfo.devDependencies).slice(0, 5).join(', ')}...\n\n`;
    } else {
        markdown += '#### Tech Stack:\n- `package.json` not found.\n\n';
    }

    // 2. Analyze file paths for structure
    const paths = relevantFiles.map(f => f.path);
    const identifiedDirs = new Set<string>();

    paths.forEach(path => {
        if (/(pages|routes|app\/routes)/.test(path)) json.routes.push(path);
        if (/(services|api|lib\/api)/.test(path)) json.apis.push(path);
        if (/(types|interfaces|models|schema)/.test(path)) json.models.push(path);
        if (/src\/[a-zA-Z0-9_-]+/.test(path)) {
           const match = path.match(/src\/([a-zA-Z0-9_-]+)/);
           if (match && match[1]) identifiedDirs.add(match[1]);
        }
    });

    json.modules = Array.from(identifiedDirs);
    markdown += '#### Directory Structure Highlights:\n';
    markdown += `- Routes/Pages found in: ${json.routes.length > 0 ? 'Yes' : 'No'}\n`;
    markdown += `- API/Services found in: ${json.apis.length > 0 ? 'Yes' : 'No'}\n`;
    markdown += `- Types/Models found in: ${json.models.length > 0 ? 'Yes' : 'No'}\n`;
    markdown += `- Top-level src modules: ${json.modules.join(', ')}\n\n`;

    // 3. Check for .env.example
    const envExampleFile = relevantFiles.find(f => f.path.endsWith('.env.example'));
    if (envExampleFile) {
        const content = await fetchTextFile({ ...params, path: envExampleFile.path });
        json.env = content.split('\n').map(line => line.split('=')[0]).filter(Boolean);
        markdown += '#### Environment Variables (from .env.example):\n';
        markdown += `${json.env.join(', ')}\n`;
    }

    return {
        markdown,
        json,
        captured_at: new Date().toISOString(),
    };
};
