# PiBuilder AI — Claude Code Instructions

## What this project is
A Next.js 14 PWA for generating Raspberry Pi GPIO projects. Users select a Pi model and components, and the app generates wiring diagrams, GPIO assignments, Python code, parts lists with pricing, and full documentation. Includes an AI Builder mode that calls the Anthropic API.

## Tech stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **PWA:** next-pwa
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Storage:** localStorage (no database)
- **Deployment:** Vercel

## Project structure
```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout + PWA meta
│   ├── page.tsx          # Entry point → App component
│   ├── globals.css       # Global styles + animations
│   └── offline/page.tsx  # PWA offline fallback
├── components/
│   ├── App.tsx           # Root state machine — all app state lives here
│   ├── HomeScreen.tsx    # Landing page with 3 mode cards
│   ├── Header.tsx        # Sticky nav with save/library/templates
│   ├── AiBuilder.tsx     # AI project generation (calls Anthropic API)
│   ├── StepPiSelect.tsx  # Step 1 — Pi model selection
│   ├── StepModules.tsx   # Step 2 — Component picker with search + filter
│   ├── BuildOutput.tsx   # Step 3 — 5 tabs: Wiring, Diagram, Code, Parts, Docs
│   ├── WiringDiagram.tsx # SVG GPIO header + component wiring diagram
│   ├── BOM.tsx           # Bill of Materials with pricing + affiliate links
│   ├── ProjectLibrary.tsx # Save/load/clone/delete projects modal
│   └── Templates.tsx     # 8 pre-built project templates modal
├── data/
│   ├── components.ts     # 31 component definitions (the core database)
│   └── projects.ts       # Templates, pricing, affiliate links, Pi prices
└── lib/
    ├── gpio.ts           # GPIO assignment engine + conflict detection
    ├── export.ts         # Code generation + Markdown docs generation
    └── storage.ts        # localStorage project save/load/clone/delete
```

## Key design decisions
- `@/*` path alias maps to `src/*` (set in tsconfig.json)
- TypeScript `strict: false` to avoid Set iteration errors on older targets
- No `[...new Set()]` spread — use `Array.from(new Set())` everywhere
- USB/RF components (Pluto+ SDR, antennas, buck converter) have `usb: true` and skip GPIO assignment
- I2C components share GPIO2/3, SPI components share GPIO8-11
- All prices are GBP, approximate retail, with Amazon affiliate tag `pibuilder-21`

## Environment variables
```
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...   # For AI Builder (client-side)
```
For production, move to a server-side API route at `src/app/api/ai/route.ts`.

## Common tasks

### Run locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Build for production
```bash
npm run build
```

### Deploy to Vercel
```bash
npx vercel --prod
```
Vercel project: `daddylarney94-4650s-projects/pibuilder`
GitHub repo: `https://github.com/daddylarney94-create/pibuilder-ai`

### Push to GitHub and auto-deploy
```bash
git add .
git commit -m "your message"
git push
# Vercel auto-deploys on push to main
```

## Adding a new component
Edit `src/data/components.ts` and add to the `COMPONENT_DB` array:
```typescript
{
  id: 'unique_id',
  name: 'Component Name',
  category: 'Output' | 'Input' | 'Sensor' | 'SDR/RF' | 'Power',
  icon: '🔌',
  power: '3.3V' | '5V' | 'USB...',
  current_ma: 10,
  pins: ['VCC', 'GND', 'DATA'],
  recommended_gpio: [17, 22, 27],   // preferred BCM pin numbers
  requires_resistor: { value: '220Ω', placement: 'in series with data pin' } | null,
  requires_capacitor: null,
  color: '#22c55e',                  // hex colour for wiring diagram
  notes: 'Beginner tip shown in wiring guide.',
  library: 'libraryname',            // pip install name
  i2c: true,    // optional — uses I2C bus (GPIO2/3)
  spi: true,    // optional — uses SPI bus (GPIO8-11)
  usb: true,    // optional — USB/SMA, no GPIO needed
  code: {
    gpiozero: `# GPIOZero code\n# Use {GPIO} as placeholder for assigned pin`,
    rpigpio:  `# RPi.GPIO code\n# Use {GPIO} as placeholder`,
  },
  wiring: [
    { from: '3.3V',       to: 'Component VCC', color: '#f97316' },
    { from: 'GND',        to: 'Component GND', color: '#6b7280' },
    { from: 'GPIO{GPIO}', to: 'Component DATA', color: '#22c55e' },
  ],
}
```
Then add pricing to `src/data/projects.ts` in `COMPONENT_PRICES`.

## Adding a new template
Edit `src/data/projects.ts` and add to `PROJECT_TEMPLATES`:
```typescript
{
  id: 'my-template',
  name: 'My Template',
  description: '2-3 sentence description.',
  icon: '🔌',
  tags: ['beginner', 'sensor'],
  piId: 'pi4',              // must match a PI_MODELS id
  componentIds: ['dht22', 'oled'],  // must match COMPONENT_DB ids
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
  estimatedCost: '£25–£35',
  buildTime: '1–2 hours',
}
```

## Known issues / things to watch
- `next-pwa` version must stay at `2.0.2` or above (earlier versions break with next 14.2.35)
- If `next.config.js` PWA wrapper causes TypeError, remove it and use plain `nextConfig`
- Never use `[...new Set()]` spread syntax — use `Array.from(new Set())` instead
- The `@/*` alias must point to `./src/*` in tsconfig paths, not `./`

## Deployment notes
- Vercel project is already linked to `daddylarney94-4650s-projects`
- GitHub remote: `https://github.com/daddylarney94-create/pibuilder-ai.git`
- GitHub token for auth: stored in Git credential helper after first push
- Production URL: `pibuilder.vercel.app` (or current Vercel assigned URL)
