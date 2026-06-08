'use client';
import { ComponentDef } from '@/data/components';
import { COMPONENT_PRICES, PI_PRICES, ESSENTIALS } from '@/data/projects';

interface PiModel {
  id: string; name: string; icon: string;
}

interface Props {
  components: ComponentDef[];
  pi: PiModel | null;
}

export default function BOM({ components, pi }: Props) {
  const piPrice = pi ? (PI_PRICES[pi.id] ?? null) : null;
  const compItems = components.map(c => ({
    comp: c,
    pricing: COMPONENT_PRICES[c.id] ?? null,
  }));

  const piTotal    = piPrice?.price ?? 0;
  const compTotal  = compItems.reduce((s, i) => s + (i.pricing?.price ?? 0), 0);
  const essTotal   = ESSENTIALS.reduce((s, e) => s + e.price, 0);
  const grandTotal = piTotal + compTotal + essTotal;

  return (
    <div className="space-y-4">
      {/* Total banner */}
      <div className="p-5 rounded-xl bg-[#071410] border border-[#22c55e] flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-1">ESTIMATED TOTAL</div>
          <div className="text-3xl font-bold text-[#4ade80]">£{grandTotal.toFixed(2)}</div>
          <div className="text-[10px] text-[#2d6a3f] mt-1">Prices are approximate retail (UK). May vary by supplier.</div>
        </div>
        <button
          onClick={() => {
            const urls = [
              ...(piPrice ? [piPrice.url] : []),
              ...compItems.filter(i => i.pricing).map(i => i.pricing!.url),
              ...ESSENTIALS.map(e => e.url),
            ];
            urls.forEach((url, i) => setTimeout(() => window.open(url, '_blank'), i * 300));
          }}
          className="px-5 py-3 rounded-lg bg-[#22c55e] text-[#030a05] text-xs font-bold hover:bg-[#4ade80] transition-colors text-center"
        >
          🛒 Buy All Parts<br />
          <span className="text-[9px] font-normal opacity-70">(opens supplier tabs)</span>
        </button>
      </div>

      {/* Pi */}
      {pi && (
        <div>
          <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">RASPBERRY PI</div>
          <div className="p-3 rounded-lg bg-[#050e08] border border-[#0d2318] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{pi.icon}</span>
              <span className="text-xs text-[#e2f8eb]">{pi.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#4ade80]">
                {piPrice ? `£${piPrice.price.toFixed(2)}` : 'Price varies'}
              </span>
              {piPrice && (
                <a href={piPrice.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1 rounded text-[9px] border border-[#0d2318] text-[#2d6a3f] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
                  Buy →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Components */}
      <div>
        <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">COMPONENTS</div>
        <div className="space-y-2">
          {compItems.map(({ comp, pricing }) => (
            <div key={comp.id} className="p-3 rounded-lg bg-[#050e08] border border-[#0d2318] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base">{comp.icon}</span>
                <div>
                  <div className="text-xs text-[#e2f8eb]">{comp.name}</div>
                  {pricing && (
                    <div className="text-[9px] text-[#2d6a3f]">{pricing.supplier}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: comp.color }}>
                  {pricing ? `£${pricing.price.toFixed(2)}` : 'Price varies'}
                </span>
                {pricing && (
                  <a href={pricing.url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1 rounded text-[9px] border border-[#0d2318] text-[#2d6a3f] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
                    Buy →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Essentials */}
      <div>
        <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">ESSENTIALS (always needed)</div>
        <div className="space-y-2">
          {ESSENTIALS.map(e => (
            <div key={e.name} className="p-3 rounded-lg bg-[#050e08] border border-[#0d2318] flex items-center justify-between">
              <span className="text-xs text-[#e2f8eb]">{e.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#4ade80]">£{e.price.toFixed(2)}</span>
                <a href={e.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1 rounded text-[9px] border border-[#0d2318] text-[#2d6a3f] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors">
                  Buy →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[9px] text-[#1a4a2e] leading-relaxed">
        * Prices are estimates based on typical UK retail. Links may include affiliate tags that support PiBuilder AI at no extra cost to you. Always compare prices before buying.
      </div>
    </div>
  );
}
