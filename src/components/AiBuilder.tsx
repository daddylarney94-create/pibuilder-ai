'use client';
import { useState } from 'react';
import { COMPONENT_DB, PI_MODELS, AI_EXAMPLES, ComponentDef } from '@/data/components';
import { PiModel } from './App';

interface AiResult {
  projectName: string;
  piId: string;
  componentIds: string[];
  description: string;
  reasoning: string;
  tips: string[];
  resolvedComponents: ComponentDef[];
  resolvedPi: PiModel;
}

interface Props {
  onHome: () => void;
  onBuild: (pi: PiModel, components: ComponentDef[], name: string) => void;
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full bg-[#4ade80] dot-pulse dot-pulse-${i + 1}`}
        />
      ))}
    </span>
  );
}

export default function AiBuilder({ onHome, onBuild }: Props) {
  const [prompt, setPrompt]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [thinking, setThinking] = useState<string[]>([]);
  const [result, setResult]     = useState<AiResult | null>(null);

  const THINK_STEPS = [
    'Analysing your project idea…',
    'Identifying required components…',
    'Selecting optimal Raspberry Pi model…',
    'Planning GPIO assignments…',
    'Generating project plan…',
  ];

  const run = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setThinking([]);
    setResult(null);

    const compList = COMPONENT_DB.map(c => `id:"${c.id}" name:"${c.name}" category:${c.category}`).join('\n');
    const piList   = PI_MODELS.map(p => `id:"${p.id}" name:"${p.name}"`).join('\n');

    const systemPrompt = `You are PiBuilder AI. A user describes a Raspberry Pi project. Select appropriate components and Pi model.

Available components:
${compList}

Available Pi models:
${piList}

Respond ONLY with valid JSON (no markdown, no preamble):
{
  "projectName": "Creative project name",
  "piId": "one of the pi model ids",
  "componentIds": ["array", "of", "component", "ids"],
  "description": "2-3 sentence friendly description of what this project does",
  "reasoning": "1-2 sentences explaining why these components were chosen",
  "tips": ["2-3 beginner tips specific to this project"]
}

Only select components that are actually needed. Be practical. Beginner-friendly.`;

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < THINK_STEPS.length) {
        setThinking(prev => [...prev, THINK_STEPS[stepIdx]]);
        stepIdx++;
      }
    }, 650);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      clearInterval(interval);
      setThinking(THINK_STEPS);

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';

      let parsed: Omit<AiResult, 'resolvedComponents' | 'resolvedPi'>;
      try {
        parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } catch {
        throw new Error('Could not parse AI response. Please try again.');
      }

      const resolvedComponents = (parsed.componentIds ?? [])
        .map((id: string) => COMPONENT_DB.find(c => c.id === id))
        .filter(Boolean) as ComponentDef[];
      const resolvedPi = PI_MODELS.find(p => p.id === parsed.piId) ?? PI_MODELS[0];

      if (!resolvedComponents.length) throw new Error('No matching components found. Try rephrasing your idea.');

      setResult({ ...parsed, resolvedComponents, resolvedPi });
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030a05] text-[#e2f8eb] font-mono grid-bg">
      {/* Header */}
      <div className="border-b border-[#0d2318] px-5 py-3 flex items-center justify-between bg-[#050e08] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#22c55e] to-[#4ade80] flex items-center justify-center text-sm">🍓</div>
          <span className="text-sm font-bold text-[#4ade80]">PiBuilder AI</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#166534] text-[#4ade80] font-bold tracking-widest">AI BUILDER</span>
        </div>
        <button onClick={onHome} className="text-[10px] text-[#2d6a3f] hover:text-[#4ade80] transition-colors">
          ← Home
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#4ade80] mb-1">Describe Your Project</h2>
          <p className="text-xs text-[#2d6a3f] leading-relaxed">
            Tell the AI what you want to build — it will select components, assign GPIO pins, and generate everything.
          </p>
        </div>

        {/* Input */}
        <div className="mb-5">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run(); }}
            placeholder="e.g. I want to build an LED strip controller with a rotary knob to change brightness…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#166534] bg-[#050e08] text-[#e2f8eb] text-xs placeholder:text-[#1a4a2e] outline-none focus:border-[#22c55e] resize-none leading-relaxed font-mono transition-colors"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-[#1a4a2e]">⌘/Ctrl+Enter to generate</span>
            <button
              onClick={run}
              disabled={loading || !prompt.trim()}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                prompt.trim() && !loading
                  ? 'bg-[#22c55e] text-[#030a05] hover:bg-[#4ade80]'
                  : 'bg-[#0d2318] text-[#1a4a2e] cursor-not-allowed'
              }`}
            >
              {loading ? 'Thinking…' : '✨ Generate Project'}
            </button>
          </div>
        </div>

        {/* Example prompts */}
        {!loading && !result && (
          <div className="mb-6">
            <div className="text-[10px] text-[#1a4a2e] tracking-widest mb-3">TRY AN EXAMPLE</div>
            <div className="flex flex-wrap gap-2">
              {AI_EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="px-3 py-1.5 rounded-full border border-[#0d2318] text-[10px] text-[#2d6a3f] hover:border-[#22c55e] hover:text-[#4ade80] transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thinking */}
        {loading && (
          <div className="mb-5 p-5 rounded-xl bg-[#050e08] border border-[#0d2318]">
            <div className="flex items-center gap-3 mb-4 text-xs text-[#4ade80] font-bold">
              <ThinkingDots /> AI is building your project
            </div>
            <div className="space-y-2">
              {thinking.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#2d6a3f]">
                  <span className="text-[#22c55e]">✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-[#1a0000] border border-[#7f1d1d] text-xs text-[#f87171]">
            🚫 {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fade-in p-5 rounded-xl border border-[#166534] bg-[#050e08]">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-base font-bold text-[#4ade80] mb-1">{result.projectName}</div>
                <div className="text-xs text-[#4a7a5a] leading-relaxed">{result.description}</div>
              </div>
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#071410] border border-[#166534] text-[10px] text-[#22c55e]">
                {result.resolvedPi.name}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">SELECTED COMPONENTS</div>
              <div className="flex flex-wrap gap-2">
                {result.resolvedComponents.map(c => (
                  <span
                    key={c.id}
                    className="px-3 py-1.5 rounded-md bg-[#071410] text-[10px]"
                    style={{ borderLeft: `2px solid ${c.color}`, color: c.color }}
                  >
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-[#071410] text-xs text-[#4a7a5a] leading-relaxed">
              💡 {result.reasoning}
            </div>

            {result.tips?.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] text-[#2d6a3f] tracking-widest mb-2">BEGINNER TIPS</div>
                <div className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex gap-2 text-xs text-[#4a7a5a] leading-relaxed">
                      <span className="text-[#22c55e] flex-shrink-0">→</span> {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => onBuild(result.resolvedPi, result.resolvedComponents, result.projectName)}
                className="flex-1 py-3 rounded-lg bg-[#22c55e] text-[#030a05] text-xs font-bold hover:bg-[#4ade80] transition-colors"
              >
                🔌 Build This Project →
              </button>
              <button
                onClick={() => { setResult(null); setThinking([]); }}
                className="px-4 py-3 rounded-lg border border-[#0d2318] text-[#2d6a3f] text-xs hover:border-[#22c55e] hover:text-[#4ade80] transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
