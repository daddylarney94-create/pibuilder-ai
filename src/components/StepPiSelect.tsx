'use client';
import { PiModel } from './App';

interface Props {
  piModels: PiModel[];
  selected: PiModel | null;
  onSelect: (pi: PiModel) => void;
  onNext: () => void;
}

export default function StepPiSelect({ piModels, selected, onSelect, onNext }: Props) {
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#4ade80] mb-1">Select Your Raspberry Pi</h2>
        <p className="text-xs text-[#2d6a3f]">This determines available GPIO pins and power budget</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {piModels.map(pi => (
          <button
            key={pi.id}
            onClick={() => onSelect(pi)}
            className={`p-5 rounded-xl text-left transition-all border ${
              selected?.id === pi.id
                ? 'border-[#22c55e] bg-[#071410] shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                : 'border-[#0d2318] bg-[#050e08] hover:border-[#1a4a2e]'
            }`}
          >
            <div className="text-2xl mb-3">{pi.icon}</div>
            <div className="text-xs font-bold text-[#4ade80] mb-3">{pi.name}</div>
            <div className="text-[10px] text-[#2d6a3f] space-y-1">
              <div>RAM: {pi.ram}</div>
              <div>GPIO: {pi.gpio} pins</div>
              <div>Max: {pi.maxCurrent}mA</div>
              <div>{pi.usb3 ? '✓ USB 3.0' : '○ USB 2.0'} · {pi.gbe ? '✓ GbE' : '○ 100M'}</div>
            </div>
            {selected?.id === pi.id && (
              <div className="mt-3 text-[9px] text-[#22c55e] font-bold tracking-widest">● SELECTED</div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            selected
              ? 'bg-[#22c55e] text-[#030a05] hover:bg-[#4ade80]'
              : 'bg-[#0d2318] text-[#1a4a2e] cursor-not-allowed'
          }`}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
