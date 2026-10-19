import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Cpu,
  Layers,
  HardDrive,
  Clock,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { useSimulationHistory } from '../hooks/useSimulationHistory';
import {
  getInitialMovementSnapshot,
  advanceMovementStep,
} from '../simulations/processMovementEngine';
import { ProcessMovementSimulator } from '../components/simulations/ProcessMovement/ProcessMovementSimulator';
import { SimulationControls } from '../components/simulation/SimulationControls';
import { StepExplanation } from '../components/simulation/StepExplanation';
import { KnowledgeCheck } from '../components/common/KnowledgeCheck';
import './SimulatorPage.css';

const SIMULATOR_KNOWLEDGE_CHECK = {
  question:
    'In an operating system with swapping, what is the primary difference between Swapping and Paging?',
  options: [
    'Swapping moves an entire process image between RAM and secondary storage, whereas Paging moves individual fixed-size 4 KB frames',
    'Swapping permanently deletes processes, whereas Paging runs them faster',
    'Swapping requires no hardware support while Paging only works on floppy disks',
    'Swapping is performed by the CPU hardware while Paging is executed by the keyboard driver',
  ],
  correctIndex: 0,
  explanation:
    'Correct! Swapping moves the entire process address space between RAM and disk swap space (used by the Medium-Term Scheduler to relieve severe memory pressure). Paging divides memory into uniform pages/frames (usually 4 KB) and transfers individual pages on demand.',
};

export function SimulatorPage() {
  const initialSnapshot = useMemo(() => getInitialMovementSnapshot(512), []);

  const sim = useSimulationHistory({
    initialSnapshot,
    getNextSnapshot: (snap) => advanceMovementStep(snap),
    defaultSpeed: 2000,
  });

  return (
    <div className="simulator-page-container container" data-component="simulator-page">
      {/* Breadcrumb Header */}
      <header className="sim-page-header">
        <div className="sim-breadcrumbs">
          <Link to="/" className="crumb-link">Home</Link>
          <ChevronRight size={14} className="crumb-separator" />
          <Link to="/learn" className="crumb-link">Learn</Link>
          <ChevronRight size={14} className="crumb-separator" />
          <span className="crumb-current">Live Process Movement Simulator</span>
        </div>

        <div className="sim-header-main">
          <Link to="/" className="btn-back">
            <ArrowLeft size={16} />
            <span>Home</span>
          </Link>

          <div className="sim-title-group">
            <div className="sim-badge-row">
              <span className="badge-pill sim-flagship-badge">
                <Sparkles size={13} />
                Flagship Interactive Engine
              </span>
              <span className="sim-scope-tag">Process + Memory Orchestration</span>
            </div>
            <h1 className="sim-title">Process Movement & Swapping Simulator</h1>
            <p className="sim-lead">
              Hover over any process card in <strong>Secondary Storage</strong> to auto-load it into <strong>RAM</strong>! Watch processes flow into the <strong>Ready Queue</strong> and execute on the <strong>CPU</strong>.
            </p>
          </div>
        </div>
      </header>

      {/* Main Simulation Workspace */}
      <main className="sim-main-workspace">
        {/* Reversible Simulation Controls */}
        <div className="sim-controls-wrapper">
          <SimulationControls
            canGoBack={sim.canGoBack}
            canGoForward={sim.canGoForward}
            onStepBackward={sim.stepBackward}
            onStepForward={sim.stepForward}
            isPlaying={sim.isPlaying}
            onTogglePlay={sim.togglePlay}
            onReset={() => sim.resetSimulation(initialSnapshot)}
            stepNumber={sim.stepNumber}
            totalSteps={sim.totalSteps}
            playbackSpeed={sim.playbackSpeed}
            onSpeedChange={sim.setPlaybackSpeed}
          />
        </div>

        {/* The 4-Connected Areas Live Visualizer */}
        <div className="sim-canvas-viewport">
          <ProcessMovementSimulator
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        </div>

        {/* 4-Pillar Live Inspector */}
        <div className="sim-explanation-viewport">
          <StepExplanation
            explanation={sim.currentSnapshot.explanation}
            actionTitle={sim.currentSnapshot.action}
          />
        </div>

        {/* Knowledge Check Assessment */}
        <div className="sim-assessment-viewport">
          <KnowledgeCheck
            conceptId="process-movement-simulator"
            knowledgeCheck={SIMULATOR_KNOWLEDGE_CHECK}
          />
        </div>
      </main>
    </div>
  );
}
