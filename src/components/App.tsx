'use client';
import { useState, useMemo, useCallback } from 'react';
import { COMPONENT_DB, PI_MODELS, ComponentDef } from '@/data/components';
import { PROJECT_TEMPLATES, ProjectTemplate, SavedProject } from '@/data/projects';
import { assignGPIOs } from '@/lib/gpio';
import { generateCode, generateDocs } from '@/lib/export';
import { saveProject, createProject } from '@/lib/storage';
import HomeScreen from './HomeScreen';
import AiBuilder from './AiBuilder';
import StepPiSelect from './StepPiSelect';
import StepModules from './StepModules';
import BuildOutput from './BuildOutput';
import Header from './Header';
import ProjectLibrary from './ProjectLibrary';
import Templates from './Templates';

export type AppMode = 'home' | 'ai' | 'manual' | 'build';

export interface PiModel {
  id: string; name: string; ram: string;
  gpio: number; usb3: boolean; gbe: boolean;
  maxCurrent: number; icon: string;
}

export default function App() {
  const [mode, setMode]                   = useState<AppMode>('home');
  const [step, setStep]                   = useState(1);
  const [selectedPi, setSelectedPi]       = useState<PiModel | null>(null);
  const [selectedComponents, setSelected] = useState<ComponentDef[]>([]);
  const [projectName, setProjectName]     = useState('My Pi Project');
  const [projectId, setProjectId]         = useState<string>('');
  const [showLibrary, setShowLibrary]     = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveFlash, setSaveFlash]         = useState(false);

  const gpioResult     = useMemo(() => assignGPIOs(selectedComponents), [selectedComponents]);
  const totalCurrentMa = selectedComponents.reduce((s, c) => s + c.current_ma, 0);

  const toggleComponent = useCallback((comp: ComponentDef) => {
    setSelected(prev =>
      prev.find(c => c.id === comp.id)
        ? prev.filter(c => c.id !== comp.id)
        : [...prev, comp]
    );
  }, []);

  const goHome = useCallback(() => setMode('home'), []);

  const goToBuild = useCallback((pi: PiModel, components: ComponentDef[], name: string, id?: string) => {
    setSelectedPi(pi);
    setSelected(components);
    setProjectName(name);
    setProjectId(id ?? '');
    setMode('build');
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedPi) return;
    const id = projectId || crypto.randomUUID();
    const project = createProject(projectName, selectedPi.id, selectedComponents.map(c => c.id));
    saveProject({ ...project, id });
    setProjectId(id);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }, [projectId, projectName, selectedPi, selectedComponents]);

  const handleLoadProject = useCallback((p: SavedProject) => {
    const pi = PI_MODELS.find(m => m.id === p.piId);
    const comps = p.componentIds.map(id => COMPONENT_DB.find(c => c.id === id)).filter(Boolean) as ComponentDef[];
    if (pi && comps.length) {
      goToBuild(pi, comps, p.name, p.id);
    }
  }, [goToBuild]);

  const handleTemplate = useCallback((t: ProjectTemplate) => {
    const pi = PI_MODELS.find(m => m.id === t.piId);
    const comps = t.componentIds.map(id => COMPONENT_DB.find(c => c.id === id)).filter(Boolean) as ComponentDef[];
    if (pi && comps.length) {
      goToBuild(pi, comps, t.name);
    }
  }, [goToBuild]);

  const downloadDocs = useCallback(() => {
    const text = generateDocs(selectedComponents, gpioResult, projectName, selectedPi);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `${projectName.replace(/\s+/g, '-').toLowerCase()}.md`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedComponents, gpioResult, projectName, selectedPi]);

  const copyCode = useCallback(async (type: 'gpiozero' | 'rpigpio') => {
    const code = generateCode(selectedComponents, gpioResult, type, projectName, selectedPi);
    await navigator.clipboard.writeText(code);
  }, [selectedComponents, gpioResult, projectName, selectedPi]);

  if (mode === 'home') return (
    <>
      <HomeScreen
        onSelectMode={setMode}
        onShowTemplates={() => setShowTemplates(true)}
        onShowLibrary={() => setShowLibrary(true)}
      />
      {showTemplates && <Templates onSelect={handleTemplate} onClose={() => setShowTemplates(false)} />}
      {showLibrary  && <ProjectLibrary onLoad={handleLoadProject} onClose={() => setShowLibrary(false)} currentProjectId={projectId} />}
    </>
  );

  if (mode === 'ai') return (
    <AiBuilder onHome={goHome} onBuild={goToBuild} />
  );

  return (
    <div className="min-h-screen bg-[#030a05] text-[#e2f8eb] font-mono">
      <Header
        mode={mode}
        step={step}
        onHome={goHome}
        onStepClick={setStep}
        onAiClick={() => setMode('ai')}
        onEditClick={() => { setMode('manual'); setStep(2); }}
        onLibrary={() => setShowLibrary(true)}
        onTemplates={() => setShowTemplates(true)}
        onSave={mode === 'build' ? handleSave : undefined}
        saveFlash={saveFlash}
        isBuild={mode === 'build'}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {mode === 'manual' && step === 1 && (
          <StepPiSelect
            piModels={PI_MODELS}
            selected={selectedPi}
            onSelect={setSelectedPi}
            onNext={() => setStep(2)}
          />
        )}
        {mode === 'manual' && step === 2 && (
          <StepModules
            components={COMPONENT_DB}
            selected={selectedComponents}
            onToggle={toggleComponent}
            totalCurrentMa={totalCurrentMa}
            maxCurrentMa={selectedPi?.maxCurrent ?? 3000}
            piName={selectedPi?.name ?? ''}
            onBack={() => setStep(1)}
            onNext={() => { setMode('build'); setStep(3); }}
          />
        )}
        {mode === 'build' && (
          <BuildOutput
            projectName={projectName}
            onProjectNameChange={setProjectName}
            selectedPi={selectedPi}
            selectedComponents={selectedComponents}
            gpioResult={gpioResult}
            totalCurrentMa={totalCurrentMa}
            onDownloadDocs={downloadDocs}
            onCopyCode={copyCode}
            generateCode={(type) => generateCode(selectedComponents, gpioResult, type, projectName, selectedPi)}
            generateDocs={() => generateDocs(selectedComponents, gpioResult, projectName, selectedPi)}
          />
        )}
      </main>
      {showTemplates && <Templates onSelect={handleTemplate} onClose={() => setShowTemplates(false)} />}
      {showLibrary  && <ProjectLibrary onLoad={handleLoadProject} onClose={() => setShowLibrary(false)} currentProjectId={projectId} />}
    </div>
  );
}
