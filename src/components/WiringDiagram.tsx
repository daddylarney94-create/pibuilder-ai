'use client';
import { ComponentDef, GPIO_PINS } from '@/data/components';
import { Assignment } from '@/lib/gpio';

interface Props {
  components: ComponentDef[];
  assignments: Record<string, Assignment>;
}

const PIN_COLORS: Record<string, string> = {
  power: '#ef4444', gnd: '#374151', i2c: '#06b6d4',
  spi: '#f59e0b', pwm: '#a855f7', gpio: '#22c55e',
  uart: '#f97316', special: '#6b7280',
};

export default function WiringDiagram({ components, assignments }: Props) {
  const W = 900, H = 520;
  const piX = 55, piY = 80, piW = 155, piH = 340;
  const pinH = piH / 20;

  const getPinY = (bcm: number) => {
    const idx = GPIO_PINS.findIndex(p => p.bcm === bcm);
    if (idx < 0) return piY + piH / 2;
    return piY + (idx / 2) * pinH + pinH / 2;
  };

  const slots = components.map((comp, i) => ({
    comp,
    x: 330 + (i % 2) * 260,
    y: 75 + Math.floor(i / 2) * 130,
  }));

  const wires = components
    .map((comp, ci) => {
      const asgn = assignments[comp.id];
      if (!asgn || asgn.primary === null) return null;
      const slot = slots[ci];
      return { x1: piX + piW, y1: getPinY(asgn.primary), x2: slot.x, y2: slot.y + 40, color: comp.color };
    })
    .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; color: string }[];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-xl border border-[#1e3a2f]"
      style={{ background: '#070f0b', fontFamily: 'monospace' }}
    >
      <defs>
        <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0d2318" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#pg)" />

      {/* Pi board */}
      <rect x={piX} y={piY} width={piW} height={piH} rx="8" fill="#0a1f14" stroke="#1a4a2e" strokeWidth="2" />
      <text x={piX + piW / 2} y={piY - 10} textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="bold">
        GPIO HEADER
      </text>

      {/* Pins */}
      {GPIO_PINS.slice(0, 40).map((pin, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const px = piX + 18 + col * 60;
        const py = piY + row * pinH + pinH / 2;
        const color = PIN_COLORS[pin.type] ?? '#22c55e';
        const isUsed = components.some(c => {
          const a = assignments[c.id];
          return a && (a.primary === pin.bcm || (a.all?.includes(pin.bcm)));
        });
        return (
          <g key={pin.pin}>
            <circle cx={px} cy={py} r={5} fill={isUsed ? color : '#1a3a2a'}
              stroke={color} strokeWidth={isUsed ? 2 : 1} opacity={isUsed ? 1 : 0.35} />
            {col === 1 && (
              <text x={px + 9} y={py + 4} fill={isUsed ? color : '#2a5a3a'}
                fontSize="6.5" opacity={isUsed ? 0.9 : 0.25}>
                {pin.bcm > 0 ? `G${pin.bcm}` : pin.label.substring(0, 4)}
              </text>
            )}
          </g>
        );
      })}

      {/* Wires */}
      {wires.map((w, i) => (
        <g key={i}>
          <path
            d={`M ${w.x1} ${w.y1} C ${w.x1 + 55} ${w.y1}, ${w.x2 - 55} ${w.y2}, ${w.x2} ${w.y2}`}
            fill="none" stroke={w.color} strokeWidth="2" opacity="0.75"
          />
          <circle cx={w.x1} cy={w.y1} r="3" fill={w.color} />
          <circle cx={w.x2} cy={w.y2} r="3" fill={w.color} />
        </g>
      ))}

      {/* Component boxes */}
      {slots.map(({ comp, x, y }) => {
        const asgn = assignments[comp.id];
        return (
          <g key={comp.id}>
            <rect x={x - 8} y={y} width={135} height={78} rx="6"
              fill="#0a1f14" stroke={comp.color} strokeWidth="1.5" />
            <text x={x + 59} y={y + 18} textAnchor="middle" fontSize="17">{comp.icon}</text>
            <text x={x + 59} y={y + 36} textAnchor="middle" fill={comp.color} fontSize="8.5" fontWeight="bold">
              {comp.name.substring(0, 17)}
            </text>
            <text x={x + 59} y={y + 51} textAnchor="middle" fill="#4ade80" fontSize="7.5">
              {asgn?.label ?? 'Unassigned'}
            </text>
            <text x={x + 59} y={y + 65} textAnchor="middle" fill="#374151" fontSize="6.5">
              {comp.power.substring(0, 20)} · {comp.current_ma}mA
            </text>
            {comp.usb && (
              <>
                <rect x={x + 86} y={y + 4} width={38} height={11} rx="2.5"
                  fill="#1a1a2e" stroke={comp.color} strokeWidth="0.5" />
                <text x={x + 105} y={y + 13} textAnchor="middle" fill={comp.color} fontSize="5.5" fontWeight="bold">
                  USB/SMA
                </text>
              </>
            )}
          </g>
        );
      })}

      {components.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#1a4a2e" fontSize="14">
          Add components to generate wiring diagram
        </text>
      )}
    </svg>
  );
}
