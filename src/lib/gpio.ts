import { ComponentDef, AVAILABLE_GPIOS } from '@/data/components';

export interface Assignment {
  primary: number | null;
  all?: number[];
  label: string;
}

export interface AssignmentResult {
  assigned: Record<string, Assignment>;
  conflicts: { comp: string; msg: string }[];
  warnings: { comp: string; msg: string }[];
}

export function assignGPIOs(components: ComponentDef[]): AssignmentResult {
  const assigned: Record<string, Assignment> = {};
  const usedPins = new Set<number>();
  const conflicts: { comp: string; msg: string }[] = [];
  const warnings: { comp: string; msg: string }[] = [];

  const needsI2C = components.some(c => c.i2c);
  const needsSPI = components.some(c => c.spi);
  if (needsI2C) { usedPins.add(2); usedPins.add(3); }
  if (needsSPI) { [8, 9, 10, 11].forEach(p => usedPins.add(p)); }

  for (const comp of components) {
    if (comp.usb) {
      assigned[comp.id] = {
        primary: null,
        label: comp.category === 'Power' ? 'Power rail (no GPIO)' : 'USB / SMA (no GPIO)',
      };
      continue;
    }
    if (comp.i2c) {
      assigned[comp.id] = { primary: 2, secondary: 3, label: 'I2C (GPIO2/3)' } as Assignment;
      continue;
    }
    if (comp.spi) {
      assigned[comp.id] = { primary: 8, all: [8, 9, 10, 11], label: 'SPI Bus' };
      continue;
    }

    const pinsNeeded =
      comp.id === 'ultrasonic' ? 2 :
      comp.id === 'rotary' ? 3 :
      comp.id === 'stepper' ? 4 :
      comp.id === 'rgb_led' ? 3 :
      1;

    let chosen: number[] | null = null;

    for (const preferred of comp.recommended_gpio) {
      if (typeof preferred !== 'number') continue;
      if (usedPins.has(preferred)) continue;

      if (pinsNeeded > 1) {
        const idx = AVAILABLE_GPIOS.indexOf(preferred);
        const block = Array.from({ length: pinsNeeded }, (_, i) => AVAILABLE_GPIOS[idx + i]);
        if (block.every(p => p !== undefined && !usedPins.has(p))) {
          chosen = block;
          break;
        }
      } else {
        chosen = [preferred];
        break;
      }
    }

    if (!chosen) {
      for (const pin of AVAILABLE_GPIOS) {
        if (usedPins.has(pin)) continue;
        if (pinsNeeded === 1) { chosen = [pin]; break; }
        const idx = AVAILABLE_GPIOS.indexOf(pin);
        const block = Array.from({ length: pinsNeeded }, (_, i) => AVAILABLE_GPIOS[idx + i]);
        if (block.every(p => p !== undefined && !usedPins.has(p))) { chosen = block; break; }
      }
    }

    if (chosen) {
      chosen.forEach(p => usedPins.add(p));
      assigned[comp.id] = {
        primary: chosen[0],
        all: chosen,
        label: chosen.map(p => `GPIO${p}`).join(', '),
      };
      if (comp.power === '5V' && !['ws2812', 'ws2812_ring', 'relay', 'servo', 'stepper', 'max7219'].includes(comp.id)) {
        warnings.push({ comp: comp.name, msg: 'Uses 5V power. Ensure data pins are 3.3V compatible.' });
      }
      if (comp.id === 'ultrasonic') {
        warnings.push({ comp: comp.name, msg: 'ECHO pin outputs 5V — use 1kΩ+2kΩ voltage divider!' });
      }
      if (comp.id === 'mq2') {
        warnings.push({ comp: comp.name, msg: '20 second preheat required before readings are valid.' });
      }
      if (comp.id === 'pir') {
        warnings.push({ comp: comp.name, msg: '30–60 second warm-up time required after power on.' });
      }
    } else {
      conflicts.push({ comp: comp.name, msg: 'No available GPIO pins — reduce number of components.' });
    }
  }

  return { assigned, conflicts, warnings };
}

export function substituteGPIO(code: string, assignment: Assignment): string {
  const gpio = assignment.primary ?? 0;
  const all = assignment.all ?? [gpio];
  return code
    .replace(/\{GPIO\+3\}/g, String(all[3] ?? gpio + 3))
    .replace(/\{GPIO\+2\}/g, String(all[2] ?? gpio + 2))
    .replace(/\{GPIO\+1\}/g, String(all[1] ?? gpio + 1))
    .replace(/\{GPIO\}/g,    String(gpio));
}
