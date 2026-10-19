import React from 'react';
import { Clock, Cpu, BarChart2, CheckCircle2 } from 'lucide-react';
import './CpuSchedulingSim.css';

export function CpuSchedulingSim({
  currentSnapshot,
  algorithm,
  onAlgorithmChange,
  timeQuantum,
  onQuantumChange,
  processes,
  onUpdateProcess,
}) {
  const { state } = currentSnapshot;
  const { gantt = [], readyQueue = [], completed = {}, metrics = {} } = state;

  return (
    <div className="cpu-scheduling-sim" data-component="cpu-scheduling-sim">
      {/* Configuration Controls Bar */}
      <div className="scheduling-config-bar">
        {/* Algorithm Switcher */}
        <div className="algorithm-toggle-group">
          <button
            type="button"
            className={`algo-btn ${algorithm === 'FCFS' ? 'active' : ''}`}
            onClick={() => onAlgorithmChange('FCFS')}
            data-component="algo-btn-fcfs"
          >
            First-Come First-Served (FCFS)
          </button>
          <button
            type="button"
            className={`algo-btn ${algorithm === 'RR' ? 'active' : ''}`}
            onClick={() => onAlgorithmChange('RR')}
            data-component="algo-btn-rr"
          >
            Round Robin (Preemptive RR)
          </button>
        </div>

        {/* Round Robin Quantum Slider */}
        {algorithm === 'RR' && (
          <div className="quantum-control-box">
            <span className="quantum-label">Time Quantum (Q):</span>
            <input
              type="range"
              min="1"
              max="5"
              value={timeQuantum}
              onChange={(e) => onQuantumChange(Number(e.target.value))}
              className="quantum-slider"
            />
            <span className="quantum-value-badge">{timeQuantum} units</span>
          </div>
        )}
      </div>

      {/* Gantt Chart Timeline */}
      <div className="gantt-chart-section" data-component="gantt-chart">
        <div className="gantt-header">
          <div className="gantt-title-row">
            <BarChart2 size={16} className="gantt-icon" />
            <span className="gantt-title">Execution Gantt Chart</span>
          </div>
          <span className="gantt-clock">
            Simulation Clock: <strong>t = {state.time}</strong>
          </span>
        </div>

        <div className="gantt-timeline-container">
          {gantt.length === 0 ? (
            <div className="gantt-empty">Simulation starts at t = 0. Click "Next" or "Auto Play" to run.</div>
          ) : (
            <div className="gantt-blocks-track">
              {gantt.map((block, idx) => (
                <div
                  key={idx}
                  className={`gantt-block ${block.processId === 'IDLE' ? 'gantt-idle' : ''}`}
                  style={{
                    backgroundColor: block.color,
                    borderColor: block.processId === 'IDLE' ? '#D8D6E8' : 'rgba(0,0,0,0.1)',
                  }}
                  title={`t = ${block.time} -> ${block.time + 1}: ${block.processId}`}
                >
                  <span className="gantt-pid">{block.processId}</span>
                  <span className="gantt-tick-label">{block.time + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Process Config Table & Live Ready Queue */}
      <div className="scheduling-split-view">
        {/* Configurable Process Table */}
        <div className="scheduling-card card-base">
          <div className="sched-card-header">
            <h4 className="sched-card-title">Configurable Workload</h4>
            <span className="sched-card-sub">Edit Arrival & Burst times</span>
          </div>

          <table className="processes-data-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>Arrival Time</th>
                <th>Burst Time</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc) => {
                const isRunning = state.activeProcessId === proc.id;
                const isFinished = completed[proc.id];
                const currentProcState = state.processes.find((p) => p.id === proc.id);
                const remaining = currentProcState ? currentProcState.remainingTime : proc.burstTime;

                return (
                  <tr key={proc.id} className={isRunning ? 'row-active' : ''}>
                    <td>
                      <span className="table-proc-badge" style={{ backgroundColor: proc.color }}>
                        {proc.id}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={proc.arrivalTime}
                        onChange={(e) =>
                          onUpdateProcess(proc.id, 'arrivalTime', Math.max(0, Number(e.target.value)))
                        }
                        className="table-input"
                        aria-label={`Arrival time for ${proc.id}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={proc.burstTime}
                        onChange={(e) =>
                          onUpdateProcess(proc.id, 'burstTime', Math.max(1, Number(e.target.value)))
                        }
                        className="table-input"
                        aria-label={`Burst time for ${proc.id}`}
                      />
                    </td>
                    <td>
                      <strong>{remaining}</strong>
                    </td>
                    <td>
                      {isFinished ? (
                        <span className="status-tag status-done">Done</span>
                      ) : isRunning ? (
                        <span className="status-tag status-running">CPU</span>
                      ) : (
                        <span className="status-tag status-waiting">Waiting</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ready Queue & Completion Table */}
        <div className="scheduling-card card-base">
          <div className="sched-card-header">
            <h4 className="sched-card-title">Ready Queue at t = {state.time}</h4>
            <span className="sched-card-sub">
              {readyQueue.length === 0 ? 'Empty queue' : `${readyQueue.length} processes waiting`}
            </span>
          </div>

          <div className="ready-queue-visual-row">
            {readyQueue.length === 0 ? (
              <span className="queue-empty-text">No processes in Ready queue</span>
            ) : (
              readyQueue.map((pid, idx) => {
                const proc = processes.find((p) => p.id === pid);
                return (
                  <div key={idx} className="queue-token" style={{ backgroundColor: proc?.color }}>
                    <span>{pid}</span>
                    <span className="queue-pos">#{idx + 1}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Metrics summary banner */}
          <div className="scheduling-metrics-strip" data-component="metrics-panel">
            <div className="metric-box">
              <span className="metric-box-label">Avg. Waiting Time</span>
              <span className="metric-box-val">{metrics.avgWaitingTime} units</span>
            </div>
            <div className="metric-box">
              <span className="metric-box-label">Avg. Turnaround Time</span>
              <span className="metric-box-val">{metrics.avgTurnaroundTime} units</span>
            </div>
            <div className="metric-box">
              <span className="metric-box-label">CPU Utilization</span>
              <span className="metric-box-val">{metrics.cpuUtilization}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
