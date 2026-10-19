import React from 'react';
import { Zap, Cpu, Layers, HardDrive, Keyboard, ShieldAlert, ArrowRight, CornerDownRight } from 'lucide-react';
import {
  INTERRUPT_STAGES,
  AVAILABLE_INTERRUPTS,
  triggerInterrupt,
} from '../../../simulations/interruptHandlingEngine';
import './InterruptHandlingSim.css';

export function InterruptHandlingSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const { currentStageIndex, selectedInterrupt, cpuRegisters, savedStack, executionLog } = state;

  const currentStage = INTERRUPT_STAGES[currentStageIndex];

  const handleTrigger = (irqId) => {
    const snap = triggerInterrupt(currentSnapshot, irqId);
    onPushSnapshot(snap);
  };

  return (
    <div className="interrupt-handling-sim" data-component="interrupt-handling-sim">
      {/* Simulation Notice Disclaimer */}
      <div className="sim-disclaimer-banner" data-component="disclaimer">
        <ShieldAlert size={16} className="disclaimer-icon" />
        <span>
          Educational Hardware Simulation: This visualizes CPU architectural behavior and register state transitions during interrupt handling. No real hardware interrupts are modified.
        </span>
      </div>

      {/* Interrupt Trigger Buttons Toolbar */}
      <div className="interrupt-triggers-bar card-base">
        <div className="triggers-header">
          <Zap size={16} className="triggers-icon" />
          <span className="triggers-title">Signal Hardware Interrupt:</span>
        </div>

        <div className="triggers-button-group">
          {AVAILABLE_INTERRUPTS.map((irq) => {
            const isSelected = selectedInterrupt.id === irq.id;
            return (
              <button
                key={irq.id}
                type="button"
                className={`btn-irq-trigger ${isSelected ? 'btn-irq-active' : ''}`}
                onClick={() => handleTrigger(irq.id)}
                title={`Trigger ${irq.name}`}
              >
                <span className="irq-chip">IRQ {irq.irqNumber}</span>
                <span className="irq-name">{irq.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8-Stage Execution Timeline Pipeline */}
      <div className="interrupt-timeline-section card-base" data-component="interrupt-timeline">
        <div className="timeline-section-header">
          <h4 className="timeline-title">Interrupt Cycle Timeline</h4>
          <span className="timeline-stage-counter">
            Stage {currentStageIndex + 1} of {INTERRUPT_STAGES.length}: <strong>{currentStage.name}</strong>
          </span>
        </div>

        <div className="timeline-stages-track">
          {INTERRUPT_STAGES.map((st, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isPast = idx < currentStageIndex;

            return (
              <div
                key={st.stageId}
                className={`timeline-stage-node ${isCurrent ? 'stage-current' : isPast ? 'stage-past' : 'stage-future'}`}
              >
                <div className="stage-node-circle" style={{ borderColor: isCurrent ? st.color : undefined }}>
                  <span>{idx + 1}</span>
                </div>
                <span className="stage-node-label">{st.name}</span>
                <span className="stage-node-badge">{st.badge}</span>
              </div>
            );
          })}
        </div>

        {/* Current Active Stage Description Callout */}
        <div className="stage-active-callout" style={{ borderLeftColor: currentStage.color }}>
          <div className="callout-header-row">
            <span className="callout-badge" style={{ backgroundColor: `${currentStage.color}20`, color: currentStage.color }}>
              {currentStage.badge}
            </span>
            <strong className="callout-title">{currentStage.name}</strong>
          </div>
          <p className="callout-desc">{currentStage.description}</p>
        </div>
      </div>

      {/* Two Column Layout: CPU Registers & System Call Stack Memory */}
      <div className="hardware-state-split">
        {/* CPU Registers Panel */}
        <div className="hardware-card card-base">
          <div className="hw-card-header">
            <Cpu size={16} className="hw-icon" />
            <h4 className="hw-title">CPU Hardware Registers</h4>
            <span className="hw-sub-mode">
              {currentStageIndex >= 4 && currentStageIndex <= 5 ? 'System Privilege Mode' : 'User Execution Mode'}
            </span>
          </div>

          <div className="registers-grid font-mono">
            <div className="register-box reg-highlight">
              <span className="reg-name">Program Counter (PC)</span>
              <span className="reg-val">{cpuRegisters.PC}</span>
            </div>
            <div className="register-box">
              <span className="reg-name">Accumulator (EAX)</span>
              <span className="reg-val">{cpuRegisters.EAX}</span>
            </div>
            <div className="register-box">
              <span className="reg-name">Base Register (EBX)</span>
              <span className="reg-val">{cpuRegisters.EBX}</span>
            </div>
            <div className="register-box">
              <span className="reg-name">CPU Status Flags</span>
              <span className="reg-val">{cpuRegisters.Flags}</span>
            </div>
          </div>
        </div>

        {/* System Stack Panel (Saved Context) */}
        <div className="hardware-card card-base">
          <div className="hw-card-header">
            <Layers size={16} className="hw-icon" />
            <h4 className="hw-title">System Call Stack (Context Preservation)</h4>
            <span className="hw-sub-mode">
              {savedStack.length > 0 ? `${savedStack.length} Frames Saved` : 'Stack Clear'}
            </span>
          </div>

          <div className="stack-frames-view font-mono">
            {savedStack.length === 0 ? (
              <div className="stack-empty-placeholder">
                Stack empty. When an interrupt triggers, PC and registers are saved here automatically.
              </div>
            ) : (
              savedStack.map((frame, idx) => (
                <div key={idx} className="stack-frame-item">
                  <span className="stack-reg-name">{frame.reg}</span>
                  <span className="stack-arrow">→</span>
                  <span className="stack-reg-val">{frame.val}</span>
                  <span className="stack-depth">0x7FF0_{idx * 4}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
