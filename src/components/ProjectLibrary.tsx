'use client';
import { useState, useEffect } from 'react';
import { SavedProject } from '@/data/projects';
import { loadProjects, deleteProject, cloneProject } from '@/lib/storage';
import { COMPONENT_DB, PI_MODELS } from '@/data/components';

interface Props {
  onLoad: (project: SavedProject) => void;
  onClose: () => void;
  currentProjectId?: string;
}

export default function ProjectLibrary({ onLoad, onClose, currentProjectId }: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(loadProjects());
    setConfirmDelete(null);
  };

  const handleClone = (id: string) => {
    cloneProject(id);
    setProjects(loadProjects());
  };

  const getPiName = (piId: string) => PI_MODELS.find(p => p.id === piId)?.name ?? piId;
  const getCompNames = (ids: string[]) =>
    ids.map(id => COMPONENT_DB.find(c => c.id === id)?.icon ?? '').join(' ');

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#050e08] border border-[#1a4a2e] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d2318]">
          <div>
            <div className="text-sm font-bold text-[#4ade80]">Project Library</div>
            <div className="text-[10px] text-[#2d6a3f]">{projects.length} saved project{projects.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="text-[#2d6a3f] hover:text-[#4ade80] transition-colors text-lg">✕</button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📂</div>
              <div className="text-sm text-[#2d6a3f]">No saved projects yet</div>
              <div className="text-xs text-[#1a4a2e] mt-1">Build a project and click Save</div>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} className={`p-4 rounded-xl border transition-all ${
                p.id === currentProjectId ? 'border-[#22c55e] bg-[#071410]' : 'border-[#0d2318] bg-[#070f0b]'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs font-bold text-[#4ade80]">{p.name}</div>
                    <div className="text-[9px] text-[#2d6a3f] mt-0.5">
                      {getPiName(p.piId)} · v{p.version} · {formatDate(p.updatedAt)}
                    </div>
                  </div>
                  {p.id === currentProjectId && (
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#166534] text-[#4ade80] font-bold">CURRENT</span>
                  )}
                </div>

                <div className="text-base mb-3 leading-relaxed">{getCompNames(p.componentIds)}</div>

                <div className="flex gap-2">
                  <button onClick={() => { onLoad(p); onClose(); }}
                    className="flex-1 py-1.5 rounded-lg bg-[#22c55e] text-[#030a05] text-[10px] font-bold hover:bg-[#4ade80] transition-colors">
                    Open
                  </button>
                  <button onClick={() => handleClone(p.id)}
                    className="px-3 py-1.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
                    Clone
                  </button>
                  {confirmDelete === p.id ? (
                    <>
                      <button onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#7f1d1d] text-[#f87171] text-[10px] font-bold">
                        Confirm
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-[10px]">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(p.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-red-800 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
