'use client';
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/data/projects';
import { COMPONENT_DB, PI_MODELS } from '@/data/components';

interface Props {
  onSelect: (template: ProjectTemplate) => void;
  onClose: () => void;
}

const DIFFICULTY_COLORS = {
  Beginner:     { bg: '#071410', border: '#166534', text: '#4ade80' },
  Intermediate: { bg: '#1a0f00', border: '#92400e', text: '#f59e0b' },
  Advanced:     { bg: '#1a0000', border: '#7f1d1d', text: '#f87171' },
};

export default function Templates({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#050e08] border border-[#1a4a2e] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d2318]">
          <div>
            <div className="text-sm font-bold text-[#4ade80]">Project Templates</div>
            <div className="text-[10px] text-[#2d6a3f]">Start from a proven design</div>
          </div>
          <button onClick={onClose} className="text-[#2d6a3f] hover:text-[#4ade80] transition-colors text-lg">✕</button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROJECT_TEMPLATES.map(t => {
            const pi = PI_MODELS.find(p => p.id === t.piId);
            const comps = t.componentIds.map(id => COMPONENT_DB.find(c => c.id === id)).filter(Boolean);
            const dc = DIFFICULTY_COLORS[t.difficulty];

            return (
              <button key={t.id} onClick={() => { onSelect(t); onClose(); }}
                className="p-4 rounded-xl border border-[#0d2318] bg-[#070f0b] text-left hover:border-[#22c55e] hover:shadow-[0_0_16px_rgba(34,197,94,0.1)] transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: dc.bg, border: `1px solid ${dc.border}`, color: dc.text }}>
                    {t.difficulty}
                  </span>
                </div>

                <div className="text-xs font-bold text-[#4ade80] mb-1 group-hover:text-white transition-colors">
                  {t.name}
                </div>
                <div className="text-[10px] text-[#4a7a5a] leading-relaxed mb-3">
                  {t.description}
                </div>

                <div className="text-base mb-2">
                  {comps.map(c => c?.icon).join(' ')}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-[#2d6a3f]">
                    {pi?.name} · {t.buildTime}
                  </div>
                  <div className="text-[10px] font-bold text-[#22c55e]">
                    {t.estimatedCost}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
