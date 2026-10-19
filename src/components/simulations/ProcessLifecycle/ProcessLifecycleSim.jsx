import React, { useState } from 'react';
import { Plus, Cpu, Clock, AlertCircle, CheckCircle, PauseCircle } from 'lucide-react';
import { PROCESS_STATES, createNewProcess } from '../../../simulations/lifecycleEngine';
import './ProcessLifecycleSim.css';

const STATE_COLUMNS = [
  { key: PROCESS_STATES.NEW, label: '1. New', desc: 'PCB created in memory', color: '#8468E8', icon: Plus },
  { key: PROCESS_STATES.READY, label: '2. Ready Queue', desc: 'Awaiting CPU slice', color: '#4878DF', icon: Clock },
  { key: PROCESS_STATES.RUNNING, label: '3. Running', desc: 'Executing on CPU Core', color: '#32A86E', icon: Cpu },
  { key: PROCESS_STATES.WAITING, label: '4. Waiting / Blocked', desc: 'Awaiting I/O device', color: '#E8773E', icon: AlertCircle },
  { key: PROCESS_STATES.TERMINATED, label: '5. Terminated', desc: 'Completed & cleaned up', color: '#6B769D', icon: CheckCircle },
];

export function ProcessLifecycleSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const [newProcName, setNewProcName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    const snap = createNewProcess(currentSnapshot, newProcName);
    onPushSnapshot(snap);
    setNewProcName('');
    setIsCreating(false);
  };

  return (
    <div className="process-lifecycle-sim" data-component="process-lifecycle-sim">
      {/* Simulation Controls Toolbar Bar */}
      <div className="sim-action-toolbar">
        <button
          type="button"
          className="btn-primary btn-sm btn-create-proc"
          onClick={() => setIsCreating(!isCreating)}
          data-component="btn-create-process"
        >
          <Plus size={16} />
          <span>Create Process</span>
        </button>

        {isCreating && (
          <form className="create-process-inline-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="e.g. Video Streamer"
              value={newProcName}
              onChange={(e) => setNewProcName(e.target.value)}
              className="proc-name-input"
              autoFocus
            />
            <button type="submit" className="btn-primary btn-sm">Add</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setIsCreating(false)}>Cancel</button>
          </form>
        )}

        <div className="active-core-indicator">
          <span className="core-dot active" />
          <span className="core-label">CPU Core #0:</span>
          <strong>{state.activeRunningId ? `${state.activeRunningId} in Execution` : 'Idle'}</strong>
        </div>
      </div>

      {/* 5 Process States Grid */}
      <div className="lifecycle-columns-grid" data-component="lifecycle-columns">
        {STATE_COLUMNS.map((col) => {
          const procsInState = state.processes.filter((p) => p.state === col.key);
          const ColIcon = col.icon;
          const isRunningCol = col.key === PROCESS_STATES.RUNNING;

          return (
            <div
              key={col.key}
              className={`lifecycle-col ${isRunningCol ? 'col-running-active' : ''}`}
              data-component={`state-column-${col.key.toLowerCase()}`}
            >
              <div className="col-header" style={{ borderTopColor: col.color }}>
                <div className="col-header-title-row">
                  <ColIcon size={16} style={{ color: col.color }} />
                  <span className="col-title">{col.label}</span>
                </div>
                <span className="col-count-badge">{procsInState.length}</span>
              </div>
              <p className="col-desc">{col.desc}</p>

              {/* Cards Bucket */}
              <div className="col-card-bucket">
                {procsInState.length === 0 ? (
                  <div className="empty-state-notice">No processes</div>
                ) : (
                  procsInState.map((proc) => {
                    const progressPercent = Math.min(
                      100,
                      Math.round((proc.cpuCyclesSpent / proc.cpuCyclesNeeded) * 100)
                    );

                    return (
                      <div
                        key={proc.id}
                        className="process-block-card"
                        style={{ borderLeftColor: proc.color }}
                        data-component="process-block-card"
                      >
                        <div className="proc-card-top">
                          <span className="proc-pid" style={{ backgroundColor: `${proc.color}20`, color: proc.color }}>
                            {proc.id}
                          </span>
                          <span className="proc-name">{proc.name}</span>
                        </div>

                        <div className="proc-meta-row">
                          <span>RAM: {proc.memoryMb} MB</span>
                          <span>Cycles: {proc.cpuCyclesSpent}/{proc.cpuCyclesNeeded}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="proc-cycles-bar">
                          <div
                            className="proc-cycles-fill"
                            style={{ width: `${progressPercent}%`, backgroundColor: proc.color }}
                          />
                        </div>

                        {proc.waitReason && (
                          <div className="proc-wait-reason">
                            <PauseCircle size={12} />
                            <span>{proc.waitReason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent State Transitions Log */}
      <div className="lifecycle-events-log card-base">
        <h4 className="events-log-title">Process Dispatcher Event Log</h4>
        <div className="events-log-stream font-mono">
          {state.eventLog.map((logMsg, i) => (
            <div key={i} className="log-line">
              <span className="log-bullet">›</span> {logMsg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
