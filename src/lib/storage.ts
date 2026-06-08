import { SavedProject } from '@/data/projects';

const KEY = 'pibuilder_projects';

export function loadProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: new Date().toISOString(), version: project.version + 1 };
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function cloneProject(id: string): SavedProject | null {
  const projects = loadProjects();
  const original = projects.find(p => p.id === id);
  if (!original) return null;
  const clone: SavedProject = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  saveProject(clone);
  return clone;
}

export function createProject(name: string, piId: string, componentIds: string[]): SavedProject {
  return {
    id: crypto.randomUUID(),
    name,
    piId,
    componentIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}
