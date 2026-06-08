# PiBuilder AI

> Raspberry Pi GPIO project generator with AI assistant

A production-ready PWA for building Raspberry Pi projects — automatic GPIO assignment, wiring diagrams, Python code generation, and AI-powered project planning.

## Features

- 🔧 **Manual Builder** — Select Pi model, pick from 31 components, get instant output
- ✨ **AI Builder** — Describe your project in plain English, AI selects components
- 📐 **Wiring Diagrams** — SVG diagrams with colour-coded wires and GPIO header
- 💻 **Code Generation** — GPIOZero and RPi.GPIO, with GPIO substitution
- ⚡ **Conflict Detection** — Auto GPIO assignment, voltage warnings, current budget
- 📄 **Documentation** — Full Markdown project guide, downloadable
- 📱 **PWA** — Installable on Android/iOS, works offline (manual mode)

## Components (31 total)

| Category | Components |
|----------|------------|
| SDR/RF   | Pluto+ SDR, Bandpass Filter, LNA Amplifier, CP Antenna, Patch Antenna |
| Power    | Buck Converter (DC-DC) |
| Output   | WS2812B Strip, WS2812B Ring, OLED, LCD 1602, Servo, Buzzer, Relay, Single LED, RGB LED, MAX7219 Matrix, Stepper Motor |
| Input    | Push Button, Rotary Encoder, RFID, Potentiometer+ADC, Capacitive Touch |
| Sensor   | DHT22, HC-SR04 Ultrasonic, PIR Motion, BMP280, Soil Moisture, MQ-2 Gas, LDR Light, IR Receiver, GPS |

## Quick Start

```bash
# 1. Clone / extract the project
cd pibuilder-ai

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Add your Anthropic API key to .env.local

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

> **Note:** The API key is used client-side for the AI Builder feature. For production, route API calls through a Next.js API route to keep the key server-side.

## Production API Route (Recommended)

For production, create `src/app/api/ai/route.ts` to proxy Anthropic calls server-side:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

Then update `AiBuilder.tsx` to call `/api/ai` instead of `https://api.anthropic.com/v1/messages`.

## Deploy to Vercel

```bash
npm install -g vercel
vercel

# Set environment variable in Vercel dashboard:
# ANTHROPIC_API_KEY = your_key
```

## Deploy to Netlify

```bash
npm run build
# Upload the .next folder via Netlify CLI or drag-and-drop
```

## PWA Installation

- **Android Chrome:** Tap the "Add to Home Screen" banner or use browser menu → Install
- **iOS Safari:** Tap Share → Add to Home Screen
- **Desktop Chrome:** Click install icon in address bar

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PWA:** next-pwa (service worker + manifest)
- **AI:** Anthropic Claude API (claude-sonnet-4)
- **No database required** — all data is local/in-memory

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with PWA meta tags
│   ├── page.tsx            # Main entry
│   ├── globals.css         # Global styles + animations
│   └── offline/page.tsx    # PWA offline fallback
├── components/
│   ├── App.tsx             # Root state machine
│   ├── HomeScreen.tsx      # Landing page
│   ├── Header.tsx          # Navigation header
│   ├── AiBuilder.tsx       # AI project generation
│   ├── StepPiSelect.tsx    # Pi model selection
│   ├── StepModules.tsx     # Component picker
│   ├── BuildOutput.tsx     # Output tabs
│   └── WiringDiagram.tsx   # SVG diagram
├── data/
│   └── components.ts       # All 31 component definitions
└── lib/
    ├── gpio.ts             # GPIO assignment engine
    └── export.ts           # Code + docs generation
```

## Adding New Components

Edit `src/data/components.ts` and add a new entry to `COMPONENT_DB`. No other code changes needed.

```typescript
{
  id: 'my_sensor',
  name: 'My Sensor',
  category: 'Sensor',
  icon: '🔬',
  power: '3.3V',
  current_ma: 10,
  pins: ['3.3V', 'GND', 'DATA'],
  recommended_gpio: [17, 22, 27],
  requires_resistor: null,
  requires_capacitor: null,
  color: '#22c55e',
  notes: 'Notes for beginners.',
  library: 'my-library',
  code: {
    gpiozero: `# Your GPIOZero code here\n# Use {GPIO} as placeholder`,
    rpigpio:  `# Your RPi.GPIO code here`,
  },
  wiring: [
    { from: '3.3V',       to: 'Sensor VCC',      color: '#f97316' },
    { from: 'GND',        to: 'Sensor GND',       color: '#6b7280' },
    { from: 'GPIO{GPIO}', to: 'Sensor DATA pin',  color: '#22c55e' },
  ],
}
```

## Licence

MIT
