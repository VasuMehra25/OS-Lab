import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { CONCEPTS } from '../data/conceptsData';
import { ConceptPageLayout } from '../components/layout/ConceptPageLayout';
import { SimulationControls } from '../components/simulation/SimulationControls';
import { StepExplanation } from '../components/simulation/StepExplanation';
import { useSimulationHistory } from '../hooks/useSimulationHistory';

// Simulation Engines
import {
  getInitialLifecycleSnapshot,
  advanceLifecycleStep,
} from '../simulations/lifecycleEngine';

import {
  DEFAULT_SCHEDULING_PROCESSES,
  calculateFCFS,
  calculateRoundRobin,
} from '../simulations/cpuSchedulingEngine';

import {
  getInitialRamSnapshot,
  getNextRamAllocationStep,
} from '../simulations/ramAllocationEngine';

import {
  getInitialVirtualMemorySnapshot,
  getNextVirtualMemoryStep,
} from '../simulations/virtualMemoryEngine';

import {
  getInitialIoSnapshot,
  advanceIoStep,
} from '../simulations/ioQueueEngine';

import {
  getInitialInterruptSnapshot,
  advanceInterruptStep,
} from '../simulations/interruptHandlingEngine';

import {
  getInitialFsSnapshot,
  getNextFileSystemStep,
} from '../simulations/fileSystemEngine';

import {
  getInitialPermissionsSnapshot,
  getNextPermissionsStep,
} from '../simulations/filePermissionsEngine';

// Visualizer Components
import { ProcessLifecycleSim } from '../components/simulations/ProcessLifecycle/ProcessLifecycleSim';
import { CpuSchedulingSim } from '../components/simulations/CpuScheduling/CpuSchedulingSim';
import { RamAllocationSim } from '../components/simulations/RamAllocation/RamAllocationSim';
import { VirtualMemorySim } from '../components/simulations/VirtualMemory/VirtualMemorySim';
import { IoQueueSim } from '../components/simulations/IoQueue/IoQueueSim';
import { InterruptHandlingSim } from '../components/simulations/InterruptHandling/InterruptHandlingSim';
import { FileSystemSim } from '../components/simulations/FileSystem/FileSystemSim';
import { FilePermissionsSim } from '../components/simulations/FilePermissions/FilePermissionsSim';

export function ConceptPage() {
  const { conceptId } = useParams();
  const concept = CONCEPTS[conceptId];

  if (!concept) {
    return <Navigate to="/learn" replace />;
  }

  return <ConceptPageInner key={conceptId} concept={concept} />;
}

function ConceptPageInner({ concept }) {
  const conceptId = concept.id;

  // Custom configuration for CPU Scheduling
  const [schedAlgorithm, setSchedAlgorithm] = useState('FCFS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [schedProcesses, setSchedProcesses] = useState(DEFAULT_SCHEDULING_PROCESSES);

  // Compute full CPU schedule snapshots when config changes
  const cpuSnapshots = useMemo(() => {
    if (conceptId !== 'cpu-scheduling') return null;
    return schedAlgorithm === 'FCFS'
      ? calculateFCFS(schedProcesses)
      : calculateRoundRobin(schedProcesses, timeQuantum);
  }, [conceptId, schedAlgorithm, timeQuantum, schedProcesses]);

  // Determine initial snapshot and generator based on conceptId
  const { initialSnapshot, getNextSnapshot } = useMemo(() => {
    switch (conceptId) {
      case 'process-lifecycle':
        return {
          initialSnapshot: getInitialLifecycleSnapshot(),
          getNextSnapshot: (snap) => advanceLifecycleStep(snap),
        };
      case 'cpu-scheduling':
        return {
          initialSnapshot: cpuSnapshots[0],
          getNextSnapshot: (snap) => {
            const currentIdx = cpuSnapshots.findIndex((s) => s.state.time === snap.state.time);
            return currentIdx >= 0 && currentIdx < cpuSnapshots.length - 1
              ? cpuSnapshots[currentIdx + 1]
              : null;
          },
        };
      case 'ram-allocation':
        return {
          initialSnapshot: getInitialRamSnapshot(),
          getNextSnapshot: (snap) => getNextRamAllocationStep(snap),
        };
      case 'virtual-memory':
        return {
          initialSnapshot: getInitialVirtualMemorySnapshot(),
          getNextSnapshot: (snap) => getNextVirtualMemoryStep(snap),
        };
      case 'io-queue':
        return {
          initialSnapshot: getInitialIoSnapshot(),
          getNextSnapshot: (snap) => advanceIoStep(snap),
        };
      case 'interrupt-handling':
        return {
          initialSnapshot: getInitialInterruptSnapshot(),
          getNextSnapshot: (snap) => advanceInterruptStep(snap),
        };
      case 'file-system':
        return {
          initialSnapshot: getInitialFsSnapshot(),
          getNextSnapshot: (snap) => getNextFileSystemStep(snap),
        };
      case 'file-permissions':
        return {
          initialSnapshot: getInitialPermissionsSnapshot(),
          getNextSnapshot: (snap) => getNextPermissionsStep(snap),
        };
      default:
        return {
          initialSnapshot: getInitialLifecycleSnapshot(),
          getNextSnapshot: null,
        };
    }
  }, [conceptId, cpuSnapshots]);

  // Simulation History Hook
  const sim = useSimulationHistory({
    initialSnapshot,
    getNextSnapshot,
    defaultSpeed: 2200,
  });

  // When CPU scheduling parameters change, reset simulation
  useEffect(() => {
    if (conceptId === 'cpu-scheduling' && cpuSnapshots && cpuSnapshots.length > 0) {
      sim.resetSimulation(cpuSnapshots[0]);
    }
  }, [schedAlgorithm, timeQuantum, schedProcesses]);

  const handleUpdateProcess = (pid, field, val) => {
    setSchedProcesses((prev) =>
      prev.map((p) => (p.id === pid ? { ...p, [field]: val } : p))
    );
  };

  // Render Visualizer
  const renderVisualizer = () => {
    switch (conceptId) {
      case 'process-lifecycle':
        return (
          <ProcessLifecycleSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'cpu-scheduling':
        return (
          <CpuSchedulingSim
            currentSnapshot={sim.currentSnapshot}
            algorithm={schedAlgorithm}
            onAlgorithmChange={setSchedAlgorithm}
            timeQuantum={timeQuantum}
            onQuantumChange={setTimeQuantum}
            processes={schedProcesses}
            onUpdateProcess={handleUpdateProcess}
          />
        );
      case 'ram-allocation':
        return (
          <RamAllocationSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'virtual-memory':
        return (
          <VirtualMemorySim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'io-queue':
        return (
          <IoQueueSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'interrupt-handling':
        return (
          <InterruptHandlingSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'file-system':
        return (
          <FileSystemSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      case 'file-permissions':
        return (
          <FilePermissionsSim
            currentSnapshot={sim.currentSnapshot}
            onPushSnapshot={sim.pushSnapshot}
          />
        );
      default:
        return <div>Concept visualizer not found</div>;
    }
  };

  return (
    <ConceptPageLayout
      concept={concept}
      simulationControls={
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
      }
      visualizationContent={renderVisualizer()}
      explanationContent={
        <StepExplanation
          explanation={sim.currentSnapshot.explanation}
          actionTitle={sim.currentSnapshot.action}
        />
      }
    />
  );
}
