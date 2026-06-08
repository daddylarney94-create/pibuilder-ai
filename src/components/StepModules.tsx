'use client';
import { useState, useMemo } from 'react';
import { ComponentDef } from '@/data/components';

interface Props {
  components: ComponentDef[];
  selected: ComponentDef[];
  onToggle: (c: ComponentDef) => void;
  totalCurrentMa: number;
  maxCurrentMa: number;
  piName: string;
  onBack: () => void;
  onNext: () => void;
}

export default function StepModules({ components, selected, onToggle, totalCurrentMa, maxCurrentMa, piName, onBack, onNext }: Props) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const categories = useMemo(() =>
    ['All', ...Array.from(new Set(components.map(c => c.category))).sort()],
    [components]
  );

  const filtered = useMemo(() =>
    components.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = cat === 'All' || c.category === cat;
      return matchSearch && matchCat;
    }),
    [components, search, cat]
  );

  const isSelected = (c: ComponentDef) => selected.some(s => s.id === c.id);
  const overBudget = totalCurrentMa > maxCurrentMa * 0.7;

  return (
    <div className="fade-in">
      {/* Title + search */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#4ade80] mb-1">Add Modules</h2>
          <p className="text-xs text-[#2d6a3f]">
            {piName} · {selected.length} selected · {totalCurrentMa}mA · {components.length} available
          </p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search components…"
          className="px-3 py-2 rounded-lg border border-[#0d2318] bg-[#050e08] text-[#4ade80] text-xs placeholder:text-[#1a4a2e] outline-none focus:border-[#22c55e] w-full sm:w-48 transition-colors"
        />
      </div>

      {/* Budget warning */}
      {overBudget && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#1a0a00] border border-[#92400e] text-xs text-[#f59e0b]">
          ⚠️ Current draw ({totalCurrentMa}mA) is approaching Pi limit ({maxCurrentMa}mA). Consider an external 5V power supply.
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              cat === c
                ? 'border-[#22c55e] bg-[#071410] text-[#4ade80]'
                : 'border-[#0d2318] text-[#2d6a3f] hover:border-[#1a4a2e]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
        {filtered.map(comp => {
          const active = isSelected(comp);
          return (
            <button
              key={comp.id}
              onClick={() => onToggle(comp)}
              className={`relative p-3 rounded-lg text-left transition-all border ${
                active
                  ? `border-[${comp.color}] bg-[#071410]`
                  : 'border-[#0d2318] bg-[#050e08] hover:border-[#1a4a2e]'
              }`}
              style={{ borderColor: active ? comp.color : undefined }}
            >
              <div className="text-xl mb-2">{comp.icon}</div>
              <div className="text-[10px] font-bold leading-tight mb-1" style={{ color: active ? comp.color : '#4ade80' }}>
                {comp.name}
              </div>
              <div className="text-[9px] text-[#2d6a3f]">{comp.category}</div>
              <div className="text-[9px] text-[#2d6a3f] mt-1">{comp.power} · {comp.current_ma}mA</div>
              {active && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-[#030a05]"
                  style={{ background: comp.color }}
                >✓</div>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#1a4a2e] text-sm">
          No components match "{search}"
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-5 p-4 rounded-lg bg-[#050e08] border border-[#0d2318]">
          <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">SELECTED MODULES</div>
          <div className="flex flex-wrap gap-2">
            {selected.map(c => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] border"
                style={{ borderColor: c.color, color: c.color }}
              >
                {c.icon} {c.name}
                <button
                  onClick={() => onToggle(c)}
                  className="opacity-50 hover:opacity-100 transition-opacity leading-none"
                >×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-xs hover:border-[#22c55e] hover:text-[#4ade80] transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            selected.length
              ? 'bg-[#22c55e] text-[#030a05] hover:bg-[#4ade80]'
              : 'bg-[#0d2318] text-[#1a4a2e] cursor-not-allowed'
          }`}
        >
          GENERATE PROJECT →
        </button>
      </div>
    </div>
  );
}
