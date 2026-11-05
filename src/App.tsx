import React, { useEffect } from 'react';
import { Header } from './components/Header/Header';
import { Grid } from './components/Grid/Grid';
import { InspectorPanel } from './components/Inspector/InspectorPanel';
import { BottomBar } from './components/Controls/BottomBar';
import { WhyModal } from './components/Panels/WhyModal';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { ScenarioLibraryModal } from './components/Scenarios/ScenarioLibraryModal';
import { ScenarioEditorModal } from './components/Scenarios/ScenarioEditorModal';
import { useSimulationStore } from './state/simulationStore';

export const App: React.FC = () => {
  const { theme } = useSimulationStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header />

      {/* Main Workspace (Grid + Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 h-full relative overflow-hidden">
          <Grid />
        </main>
        <aside className="h-full shrink-0">
          <InspectorPanel />
        </aside>
      </div>

      {/* Bottom Bar (Playback, Timeline, Event drawer) */}
      <BottomBar />

      {/* Modals */}
      <WhyModal />
      <TutorialModal />
      <ScenarioLibraryModal />
      <ScenarioEditorModal />
    </div>
  );
};

export default App;
