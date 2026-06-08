'use client';
import { useState } from 'react';
import { ComponentDef } from '@/data/components';
import { AssignmentResult, Assignment, substituteGPIO } from '@/lib/gpio';
import { PiModel } from './App';
import WiringDiagram from './WiringDiagram';
import BOM from './BOM';

interface Props {
  projectName: string;
  onProjectNameChange: (n: string) => void;
  selectedPi: PiModel | null;
  selectedComponents: ComponentDef[];
  gpioResult: AssignmentResult;
  totalCurrentMa: number;
  onDownloadDocs: () => void;
  onCopyCode: (type: 'gpiozero' | 'rpigpio') => Promise<void>;
  generateCode: (type: 'gpiozero' | 'rpigpio') => string;
  generateDocs: () => string;
}

type Tab = 'wiring' | 'diagram' | 'code' | 'bom' | 'docs';
type CodeType = 'gpiozero' | 'rpigpio';

interface WiringStep {
  comp: ComponentDef;
  asgn: Assignment;
  items: { from: string; to: string; color: string }[];
}

export default function BuildOutput({
  projectName, onProjectNameChange, selectedPi, selectedComponents,
  gpioResult, totalCurrentMa, onDownloadDocs, onCopyCode, generateCode, generateDocs,
}: Props) {
  const [tab, setTab]           = useState<Tab>('wiring');
  const [codeType, setCodeType] = useState<CodeType>('gpiozero');
  const [copied, setCopied]     = useState(false);

  const { assigned, conflicts, warnings } = gpioResult;

  const wiringSteps: WiringStep[] = [];
  for (const comp of selectedComponents) {
    const asgn = assigned[comp.id];
    if (!asgn) continue;
    const items: { from: string; to: string; color: string }[] = [];
    for (const w of comp.wiring) {
      items.push({ from: substituteGPIO(w.from, asgn), to: w.to, color: w.color });
    }
    if (comp.requires_resistor) {
      items.push({ from: '⚠️ Resistor required', to: `${comp.requires_resistor.value} — ${comp.requires_resistor.placement}`, color: '#f59e0b' });
    }
    if (comp.requires_capacitor) {
      items.push({ from: '⚠️ Capacitor required', to: `${comp.requires_capacitor.value} — ${comp.requires_capacitor.placement}`, color: '#06b6d4' });
    }
    wiringSteps.push({ comp, asgn, items });
  }

  function uniqueLibs(): string[] {
    const seen: Record<string, boolean> = {};
    const result: string[] = [];
    for (const c of selectedComponents) {
      if (c.library !== 'n/a' && !seen[c.library]) {
        seen[c.library] = true;
        result.push(c.library);
      }
    }
    return result;
  }

  const handleCopy = async () => {
    await onCopyCode(codeType);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'wiring',  label: '🔌 Wiring'  },
    { key: 'diagram', label: '📐 Diagram' },
    { key: 'code',    label: '💻 Code'    },
    { key: 'bom',     label: '🛒 Parts'   },
    { key: 'docs',    label: '📄 Docs'    },
  ];

  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <input value={projectName} onChange={e => onProjectNameChange(e.target.value)}
            className="text-lg font-bold text-[#4ade80] bg-transparent border-none outline-none font-mono w-full max-w-xs" />
          <div className="text-xs text-[#2d6a3f] mt-0.5">
            {selectedPi?.name} · {selectedComponents.length} modules · {totalCurrentMa}mA total
          </div>
        </div>
        <button onClick={onDownloadDocs}
          className="px-4 py-2 rounded-lg border border-[#0d2318] text-[#4ade80] text-xs hover:bg-[#071410] transition-colors">
          ⬇ Download Docs
        </button>
      </div>

      {conflicts.map((c, i) => (
        <div key={i} className="mb-3 px-4 py-2.5 rounded-lg bg-[#1a0000] border border-[#7f1d1d] text-xs text-[#f87171]">
          🚫 {c.comp}: {c.msg}
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} className="mb-3 px-4 py-2.5 rounded-lg bg-[#1a0a00] border border-[#92400e] text-xs text-[#f59e0b]">
          ⚠️ {w.comp}: {w.msg}
        </div>
      ))}

      <div className="mb-5 p-4 rounded-lg bg-[#050e08] border border-[#0d2318]">
        <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">GPIO ASSIGNMENTS</div>
        <div className="flex flex-wrap gap-2">
          {selectedComponents.map(c => (
            <div key={c.id} className="px-3 py-1.5 rounded-md bg-[#071410] text-[10px]" style={{ borderLeft: `2px solid ${c.color}` }}>
              <span style={{ color: c.color }}>{c.icon} {c.name}</span>
              <span className="text-[#2d6a3f] mx-1.5">→</span>
              <span className="text-[#4ade80]">{assigned[c.id]?.label ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-[#0d2318] mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-[#22c55e] text-[#4ade80]' : 'border-transparent text-[#2d6a3f] hover:text-[#4a7a5a]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'wiring' && (
        <div className="space-y-4">
          {wiringSteps.map(({ comp, items }) => (
            <div key={comp.id} className="p-4 rounded-lg bg-[#050e08]" style={{ borderLeft: `2px solid ${comp.color}` }}>
              <div className="text-sm font-bold mb-3" style={{ color: comp.color }}>{comp.icon} {comp.name}</div>
              <div className="space-y-2">
                {items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-3 p-2 rounded bg-[#070f0b]">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: item.color }} />
                    <div className="text-xs leading-relaxed">
                      <span className="text-[#4ade80] font-bold">{item.from}</span>
                      <span className="text-[#2d6a3f] mx-2">──→</span>
                      <span className="text-[#a7f3c0]">{item.to}</span>
                    </div>
                  </div>
                ))}
              </div>
              {comp.notes && (
                <div className="mt-3 p-2 rounded bg-[#071410] text-[10px] text-[#4a7a5a] leading-relaxed">💡 {comp.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'diagram' && (
        <div>
          <WiringDiagram components={selectedComponents} assignments={assigned} />
          <p className="text-[10px] text-[#2d6a3f] text-center mt-3">
            Highlighted pins = active · Lines show GPIO-to-component routing
          </p>
        </div>
      )}

      {tab === 'code' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2">
              {(['gpiozero', 'rpigpio'] as CodeType[]).map(t => (
                <button key={t} onClick={() => setCodeType(t)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    codeType === t ? 'bg-[#22c55e] text-[#030a05]' : 'border border-[#0d2318] text-[#2d6a3f] hover:border-[#22c55e]'
                  }`}>
                  {t === 'gpiozero' ? 'GPIOZero' : 'RPi.GPIO'}
                </button>
              ))}
            </div>
            <button onClick={handleCopy}
              className="px-4 py-2 rounded-lg border border-[#0d2318] text-xs transition-colors hover:border-[#22c55e]"
              style={{ color: copied ? '#22c55e' : '#2d6a3f' }}>
              {copied ? '✓ Copied!' : '⎘ Copy'}
            </button>
          </div>
          <pre className="p-5 rounded-lg bg-[#050e08] border border-[#0d2318] text-[11px] leading-relaxed text-[#a7f3c0] overflow-auto max-h-[480px] whitespace-pre-wrap">
            {generateCode(codeType)}
          </pre>
          <div className="mt-4 p-4 rounded-lg bg-[#050e08] border border-[#0d2318]">
            <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">INSTALL DEPENDENCIES</div>
            <pre className="text-xs text-[#4ade80]">{uniqueLibs().map(l => `pip install ${l}`).join('\n')}</pre>
          </div>
        </div>
      )}

      {tab === 'bom' && (
        <BOM components={selectedComponents} pi={selectedPi} />
      )}

      {tab === 'docs' && (
        <div>
          <pre className="p-5 rounded-lg bg-[#050e08] border border-[#0d2318] text-[10px] leading-relaxed text-[#a7f3c0] overflow-auto max-h-[500px] whitespace-pre-wrap">
            {generateDocs()}
          </pre>
          <button onClick={onDownloadDocs}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#22c55e] text-[#030a05] text-xs font-bold hover:bg-[#4ade80] transition-colors">
            ⬇ Download Markdown
          </button>
        </div>
      )}
    </div>
  );
}
