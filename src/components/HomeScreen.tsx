'use client';
import { AppMode } from './App';

const FEATURES = ['Wiring diagrams','GPIO assignment','Python code','Parts lists','Conflict detection','Export docs','Project library','BOM + pricing'];

interface Props {
  onSelectMode: (m: AppMode) => void;
  onShowTemplates: () => void;
  onShowLibrary: () => void;
}

export default function HomeScreen({ onSelectMode, onShowTemplates, onShowLibrary }: Props) {
  return (
    <div className="min-h-screen bg-[#030a05] text-[#e2f8eb] font-mono grid-bg">
      <div className="border-b border-[#0d2318] px-6 py-4 flex items-center justify-between bg-[#050e08]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#4ade80] flex items-center justify-center text-lg">🍓</div>
          <div>
            <div className="text-sm font-bold text-[#4ade80] tracking-wider">PiBuilder AI</div>
            <div className="text-[10px] text-[#2d6a3f] tracking-widest">GPIO PROJECT GENERATOR</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowLibrary}
            className="px-3 py-1.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
            📂 My Projects
          </button>
          <button onClick={onShowTemplates}
            className="px-3 py-1.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-[10px] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
            📋 Templates
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div className="text-[10px] text-[#2d6a3f] tracking-[0.2em] mb-4 uppercase">Raspberry Pi Project Tool</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#4ade80] leading-tight mb-4">
          Build Pi Projects<br />
          <span className="text-[#22c55e] opacity-60">Without the Guesswork</span>
        </h1>
        <p className="text-sm text-[#4a7a5a] leading-relaxed mb-10">
          Select your Pi and modules — get instant wiring diagrams, GPIO assignments, Python code,
          parts pricing, and full documentation.
        </p>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <button onClick={() => onSelectMode('manual')}
            className="p-6 rounded-xl border border-[#0d2318] bg-[#050e08] text-left hover:border-[#22c55e] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all">
            <div className="text-2xl mb-2">🔧</div>
            <div className="text-xs font-bold text-[#4ade80] mb-1">Manual</div>
            <div className="text-[10px] text-[#2d6a3f] leading-relaxed">Pick Pi + modules yourself</div>
          </button>

          <button onClick={() => onSelectMode('ai')}
            className="relative p-6 rounded-xl border border-[#166534] bg-[#050e08] text-left hover:border-[#22c55e] hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all">
            <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-[#166534] text-[#4ade80] font-bold">AI</span>
            <div className="text-2xl mb-2">✨</div>
            <div className="text-xs font-bold text-[#4ade80] mb-1">AI Builder</div>
            <div className="text-[10px] text-[#2d6a3f] leading-relaxed">Describe your project</div>
          </button>

          <button onClick={onShowTemplates}
            className="p-6 rounded-xl border border-[#0d2318] bg-[#050e08] text-left hover:border-[#22c55e] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-xs font-bold text-[#4ade80] mb-1">Templates</div>
            <div className="text-[10px] text-[#2d6a3f] leading-relaxed">Start from examples</div>
          </button>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {FEATURES.map(f => (
            <span key={f} className="px-3 py-1 rounded-full border border-[#0d2318] text-[10px] text-[#2d6a3f]">✓ {f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
