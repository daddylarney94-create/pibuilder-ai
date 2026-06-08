'use client';
import { AppMode } from './App';

interface HeaderProps {
  mode: AppMode;
  step: number;
  onHome: () => void;
  onStepClick: (s: number) => void;
  onAiClick: () => void;
  onEditClick: () => void;
  onLibrary: () => void;
  onTemplates: () => void;
  onSave?: () => void;
  saveFlash?: boolean;
  isBuild: boolean;
}

export default function Header({ mode, step, onHome, onStepClick, onAiClick, onEditClick, onLibrary, onTemplates, onSave, saveFlash, isBuild }: HeaderProps) {
  return (
    <div className="border-b border-[#0d2318] px-4 py-3 flex items-center justify-between bg-[#050e08] sticky top-0 z-40">
      <button onClick={onHome} className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#22c55e] to-[#4ade80] flex items-center justify-center text-sm">🍓</div>
        <span className="text-sm font-bold text-[#4ade80] hidden sm:block">PiBuilder AI</span>
      </button>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {isBuild ? (
          <>
            {onSave && (
              <button onClick={onSave}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                  saveFlash
                    ? 'bg-[#22c55e] text-[#030a05] border-[#22c55e]'
                    : 'border-[#166534] text-[#4ade80] hover:bg-[#071410]'
                }`}>
                {saveFlash ? '✓ Saved!' : '💾 Save'}
              </button>
            )}
            <button onClick={onTemplates}
              className="px-3 py-1.5 rounded-md border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors hidden sm:block">
              📋 Templates
            </button>
            <button onClick={onLibrary}
              className="px-3 py-1.5 rounded-md border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
              📂 Library
            </button>
            <button onClick={onAiClick}
              className="px-3 py-1.5 rounded-md bg-[#071410] border border-[#166534] text-[#4ade80] text-[10px] font-bold hover:bg-[#0a1f14] transition-colors">
              ✨ AI
            </button>
            <button onClick={onEditClick}
              className="px-3 py-1.5 rounded-md border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
              ✏️ Edit
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(s => (
              <button key={s} onClick={() => s < step && onStepClick(s)} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  step >= s ? 'bg-[#22c55e] text-[#030a05]' : 'bg-[#0d2318] border border-[#1a4a2e] text-[#2d6a3f]'
                }`}>{s}</div>
                <span className={`text-[10px] hidden sm:block ${step >= s ? 'text-[#4ade80]' : 'text-[#1a4a2e]'}`}>
                  {s === 1 ? 'Pi' : s === 2 ? 'Modules' : 'Generate'}
                </span>
                {s < 3 && <div className={`w-4 h-px ${step > s ? 'bg-[#22c55e]' : 'bg-[#0d2318]'}`} />}
              </button>
            ))}
          </div>
        )}
        <button onClick={onHome} className="ml-1 text-[10px] text-[#1a4a2e] hover:text-[#2d6a3f] transition-colors">← Home</button>
      </div>
    </div>
  );
}
