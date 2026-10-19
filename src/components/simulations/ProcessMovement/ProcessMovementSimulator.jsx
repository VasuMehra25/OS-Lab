import React, { useState, useRef, useMemo } from 'react';
import {
  HardDrive,
  Layers,
  Clock,
  Cpu,
  Plus,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  createMovementProcess,
  swapOutProcess,
  swapInProcess,
  changeRamCapacity,
  admitProcessToRam,
  RAM_CAPACITY_OPTIONS,
  BLOCK_SIZE_KB,
} from '../../../simulations/processMovementEngine';
import './ProcessMovementSimulator.css';

function getContrastTextColor(hexColor) {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#1A1800' : '#FFFFFF';
}

export function ProcessMovementSimulator({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const {
    blocks,
    processes,
    storageQueue,
    ramAllocatedIds,
    readyQueue,
    activeCpuId,
    swappedQueue,
    terminatedQueue,
    selectedProcessId,
    lastAllocationFailed,
    ramCapacityKb,
    metrics,
  } = state;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProcName, setNewProcName] = useState('');
  const [newProcSize, setNewProcSize] = useState(64);
  const [newProcBurst, setNewProcBurst] = useState(4);
  const [activeInspectorId, setActiveInspectorId] = useState(selectedProcessId || 'P1');
  const [hoveringPid, setHoveringPid] = useState(null);
  const hoverTimerRef = useRef(null);

  // Find inspected and active process
  const inspectedProcess = processes.find((p) => p.id === activeInspectorId) || processes[0];
  const activeCpuProcess = processes.find((p) => p.id === activeCpuId);
  const hoveringProcess = processes.find((p) => p.id === hoveringPid);

  // Calculate preview RAM blocks that the hovered process will enter
  const previewBlockIndices = useMemo(() => {
    if (!hoveringProcess || !storageQueue.includes(hoveringProcess.id)) return [];
    const neededBlocks = Math.ceil(hoveringProcess.sizeKb / BLOCK_SIZE_KB);
    let startIdx = -1;
    let count = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].processId === null) {
        if (count === 0) startIdx = i;
        count++;
        if (count === neededBlocks) {
          const indices = [];
          for (let j = startIdx; j < startIdx + neededBlocks; j++) {
            indices.push(blocks[j].blockId);
          }
          return indices;
        }
      } else {
        count = 0;
        startIdx = -1;
      }
    }
    return [];
  }, [hoveringProcess, storageQueue, blocks]);

  const handleCreateProcess = (e) => {
    e.preventDefault();
    const snap = createMovementProcess(currentSnapshot, newProcName, newProcSize, newProcBurst);
    onPushSnapshot(snap);
    setNewProcName('');
    setShowCreateModal(false);
    setActiveInspectorId(snap.state.selectedProcessId);
  };

  const handleQuickPreset = (presetName, sizeKb, burst) => {
    const snap = createMovementProcess(currentSnapshot, presetName, sizeKb, burst);
    onPushSnapshot(snap);
    setActiveInspectorId(snap.state.selectedProcessId);
  };

  const handleSwapOut = (pid) => {
    const snap = swapOutProcess(currentSnapshot, pid);
    onPushSnapshot(snap);
  };

  const handleSwapIn = (pid) => {
    const snap = swapInProcess(currentSnapshot, pid);
    onPushSnapshot(snap);
  };

  // Hover-to-admit: hovering over a secondary storage card auto-loads it into RAM in 350ms!
  const handleStorageCardMouseEnter = (pid) => {
    setHoveringPid(pid);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const snap = admitProcessToRam(currentSnapshot, pid);
      onPushSnapshot(snap);
      setActiveInspectorId(pid);
      setHoveringPid(null);
    }, 360);
  };

  const handleStorageCardMouseLeave = () => {
    setHoveringPid(null);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  // Hover-to-swap-in for swapped-out cards
  const handleSwappedCardMouseEnter = (pid) => {
    setHoveringPid(pid);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const snap = swapInProcess(currentSnapshot, pid);
      onPushSnapshot(snap);
      setActiveInspectorId(pid);
      setHoveringPid(null);
    }, 360);
  };

  // Click-to-admit: immediate
  const handleAdmitDirect = (pid) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const snap = admitProcessToRam(currentSnapshot, pid);
    onPushSnapshot(snap);
    setActiveInspectorId(pid);
    setHoveringPid(null);
  };

  const handleCapacityChange = (newKb) => {
    const snap = changeRamCapacity(currentSnapshot, newKb);
    onPushSnapshot(snap);
  };

  return (
    <div className="process-movement-simulator" data-component="process-movement-simulator">
      {/* Simulation Top Metrics Ribbon */}
      <div className="movement-metrics-ribbon card-base" data-component="metrics-panel">
        <div className="ribbon-metric">
          <span className="metric-tag">Physical RAM</span>
          <span className="metric-primary-val">
            <strong>{metrics.usedRamKb}</strong> / {metrics.totalRamKb} KB
          </span>
          <span className="metric-sub-val">{metrics.ramUtilizationPercent}% Allocated</span>
        </div>

        <div className="ribbon-gauge-col">
          <div className="ribbon-gauge-track">
            <div
              className="ribbon-gauge-fill"
              style={{
                width: `${metrics.ramUtilizationPercent}%`,
                backgroundColor:
                  metrics.ramUtilizationPercent > 85 ? 'var(--pastel-pink-accent)' : 'var(--pastel-green-accent)',
              }}
            />
          </div>
          <span className="ribbon-gauge-legend">{metrics.freeRamKb} KB Free Contiguous</span>
        </div>

        <div className="ribbon-metric">
          <span className="metric-tag">Active CPU Task</span>
          <span className="metric-primary-val font-mono">{metrics.cpuRunning}</span>
          <span className="metric-sub-val">Core #0 Running</span>
        </div>

        <div className="ribbon-metric">
          <span className="metric-tag">State Counts</span>
          <span className="metric-pill-counts">
            <span className="state-badge badge-storage">Disk: {metrics.storageCount}</span>
            <span className="state-badge badge-ready">Ready: {metrics.readyCount}</span>
            <span className="state-badge badge-swap">Swap: {metrics.swappedCount}</span>
          </span>
        </div>
      </div>

      {/* Allocation Failure / Memory Exhaustion Alert Banner */}
      {lastAllocationFailed && (
        <div className="allocation-failure-alert card-base" data-component="allocation-failure-alert">
          <AlertTriangle size={24} className="alert-icon" />
          <div className="alert-message-content">
            <h4 className="alert-title">
              Memory Allocation Warning: Cannot Admit {lastAllocationFailed.processId} ({lastAllocationFailed.processName})
            </h4>
            <p className="alert-body">
              {lastAllocationFailed.isFragmented
                ? `External Fragmentation Detected! Total free memory (${lastAllocationFailed.freeKb} KB) is theoretically sufficient, but it is broken into scattered holes smaller than ${lastAllocationFailed.requestedKb} KB.`
                : `Physical RAM is full! Only ${lastAllocationFailed.freeKb} KB is available, but ${lastAllocationFailed.requestedKb} KB is required.`}
            </p>
          </div>

          {ramAllocatedIds.length > 0 && (
            <div className="alert-action-wrap">
              <button
                type="button"
                className="btn-primary btn-sm btn-swap-suggest"
                onClick={() => handleSwapOut(ramAllocatedIds[0])}
              >
                <RefreshCw size={14} />
                <span>Swap Out {ramAllocatedIds[0]} to Disk</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toolbar: RAM Capacity Selector & Create Process */}
      <div className="simulator-config-toolbar card-base">
        <div className="toolbar-left">
          <button
            type="button"
            className="btn-primary btn-sm btn-create"
            onClick={() => setShowCreateModal(true)}
            data-component="btn-create-process"
          >
            <Plus size={16} />
            <span>Create Custom Process</span>
          </button>

          {/* Quick Presets */}
          <div className="quick-presets-group">
            <span className="presets-label">Quick Add:</span>
            <button
              type="button"
              className="btn-preset"
              onClick={() => handleQuickPreset('Browser Tab', 64, 4)}
            >
              + Browser (64KB)
            </button>
            <button
              type="button"
              className="btn-preset"
              onClick={() => handleQuickPreset('Video Game', 128, 6)}
            >
              + Game Engine (128KB)
            </button>
            <button
              type="button"
              className="btn-preset"
              onClick={() => handleQuickPreset('Utility Daemon', 32, 2)}
            >
              + Daemon (32KB)
            </button>
          </div>
        </div>

        {/* Change RAM Capacity */}
        <div className="ram-capacity-selector">
          <Sliders size={16} className="capacity-icon" />
          <span className="capacity-label">RAM Capacity:</span>
          <select
            className="capacity-select"
            value={ramCapacityKb}
            onChange={(e) => handleCapacityChange(Number(e.target.value))}
            aria-label="Change RAM Capacity"
          >
            {RAM_CAPACITY_OPTIONS.map((opt) => (
              <option key={opt.kb} value={opt.kb}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- THE FOUR CONNECTED AREAS VISUALIZATION --- */}
      <div className="four-areas-canvas card-base" data-component="computer-visualization">
        {/* Visual Connecting Pathway Labels */}
        <div className="flow-pathways-header">
          <div className="pathway-step-indicator">
            <span className="step-num">1</span> Secondary Storage
            <ArrowRight size={14} className="flow-arrow" />
          </div>
          <div className="pathway-step-indicator">
            <span className="step-num">2</span> RAM Allocation (First-Fit)
            <ArrowRight size={14} className="flow-arrow" />
          </div>
          <div className="pathway-step-indicator">
            <span className="step-num">3</span> Ready Queue
            <ArrowRight size={14} className="flow-arrow" />
          </div>
          <div className="pathway-step-indicator">
            <span className="step-num">4</span> CPU Core Execution
          </div>
        </div>

        <div className="four-areas-grid">
          {/* =========================================
              AREA 1: SECONDARY STORAGE (DISK & SWAP)
             ========================================= */}
          <div className="system-area area-storage card-base" data-component="secondary-storage">
            <div className="area-header header-storage">
              <div className="area-title-group">
                <div className="hardware-icon-box storage-hw-box">
                  <HardDrive size={18} className="area-icon" />
                </div>
                <div>
                  <h4 className="area-title">1. Secondary Storage</h4>
                  <span className="area-sub-hardware">SSD / Swap Disk</span>
                </div>
              </div>
              <span className="area-badge-count">{storageQueue.length + swappedQueue.length} on Disk</span>
            </div>

            <p className="area-desc">Processes awaiting memory admission or swapped out from RAM.</p>

            {/* Hover-to-load instruction banner */}
            <div className="storage-hover-hint">
              <Zap size={12} className="hover-hint-icon" />
              <strong>Hover over a card to auto-load into RAM</strong> · or click to load instantly
            </div>

            <div className="storage-sub-bucket">
              <span className="sub-bucket-title">Admission Waiting Queue ({storageQueue.length})</span>
              <div className="process-cards-stream">
                {storageQueue.length === 0 ? (
                  <div className="empty-bucket-text">Storage queue empty</div>
                ) : (
                  storageQueue.map((pid) => {
                    const proc = processes.find((p) => p.id === pid);
                    if (!proc) return null;
                    const isInspected = inspectedProcess?.id === proc.id;
                    const isHovering = hoveringPid === proc.id;

                    return (
                      <div
                        key={proc.id}
                        className={`process-token-card storage-admit-card ${isInspected ? 'card-inspected' : ''} ${isHovering ? 'card-admitting' : ''}`}
                        style={{ borderLeftColor: proc.color }}
                        onMouseEnter={() => handleStorageCardMouseEnter(proc.id)}
                        onMouseLeave={handleStorageCardMouseLeave}
                        onClick={() => handleAdmitDirect(proc.id)}
                        title={`Click or hover to load ${proc.name} into RAM`}
                        data-component={`storage-card-${proc.id}`}
                      >
                        <div className="token-top-row">
                          <span className="token-pid" style={{ backgroundColor: proc.color }}>
                            {proc.id}
                          </span>
                          <span className="token-name">{proc.name}</span>
                        </div>
                        <div className="token-specs">
                          <span>{proc.sizeKb} KB</span>
                          <span>{proc.burstTicks} ticks</span>
                        </div>
                        {/* Hover progress indicator */}
                        <div className={`admit-progress-bar ${isHovering ? 'bar-active' : ''}`} />
                        {/* Arrow CTA */}
                        <div className="admit-arrow-cta">
                          <ArrowRight size={12} className="cta-arrow" />
                          <span>Load into RAM</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Swapped Out Section */}
            {swappedQueue.length > 0 && (
              <div className="storage-sub-bucket swapped-bucket">
                <div className="swapped-title-row">
                  <span className="sub-bucket-title">Swapped Out Space ({swappedQueue.length})</span>
                  <span className="swapped-tag">Swap Space</span>
                </div>
                <div className="process-cards-stream">
                  {swappedQueue.map((pid) => {
                    const proc = processes.find((p) => p.id === pid);
                    if (!proc) return null;
                    return (
                      <div
                        key={proc.id}
                        className={`process-token-card swapped-token ${hoveringPid === proc.id ? 'card-admitting' : ''}`}
                        style={{ borderLeftColor: proc.color }}
                        onMouseEnter={() => handleSwappedCardMouseEnter(proc.id)}
                        onMouseLeave={handleStorageCardMouseLeave}
                        onClick={() => handleSwapIn(proc.id)}
                        title={`Click or hover to swap ${proc.name} back into RAM`}
                      >
                        <div className="token-top-row">
                          <span className="token-pid" style={{ backgroundColor: proc.color }}>
                            {proc.id}
                          </span>
                          <span className="token-name">{proc.name}</span>
                        </div>
                        <div className="swapped-action-row">
                          <span className="token-specs">{proc.sizeKb} KB</span>
                          <button
                            type="button"
                            className="btn-swap-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwapIn(proc.id);
                            }}
                            title="Swap process back into RAM"
                          >
                            <RefreshCw size={12} />
                            <span>Swap In</span>
                          </button>
                        </div>
                        {/* Hover progress bar */}
                        <div className={`admit-progress-bar ${hoveringPid === proc.id ? 'bar-active' : ''}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              AREA 2: PHYSICAL RAM (BLOCK GRID)
             ========================================= */}
          <div className="system-area area-ram card-base" data-component="ram-pipeline">
            <div className="area-header header-ram">
              <div className="area-title-group">
                <div className="hardware-icon-box ram-hw-box">
                  <Layers size={18} className="area-icon" />
                </div>
                <div>
                  <h4 className="area-title">2. Physical RAM Grid</h4>
                  <span className="area-sub-hardware">DDR5 Memory Blocks</span>
                </div>
              </div>
              <span className="area-badge-count">
                {ramAllocatedIds.length} Process{ramAllocatedIds.length !== 1 ? 'es' : ''} in RAM
              </span>
            </div>

            <p className="area-desc">
              {ramCapacityKb} KB partitioned into {blocks.length} contiguous 32 KB address blocks.
            </p>

            {/* Visual RAM Grid */}
            <div className="live-ram-blocks-grid">
              {blocks.map((block) => {
                const isOccupied = block.processId !== null;
                const proc = processes.find((p) => p.id === block.processId);
                const isPreviewLanding = previewBlockIndices.includes(block.blockId);
                const isFocused =
                  (hoveringPid && (block.processId === hoveringPid || isPreviewLanding)) ||
                  (inspectedProcess && block.processId === inspectedProcess.id);

                const textColor = isOccupied ? getContrastTextColor(block.color) : undefined;

                return (
                  <div
                    key={block.blockId}
                    className={`movement-ram-block ${
                      isOccupied ? 'block-taken block-taken-solid' : 'block-empty block-empty-solid'
                    } ${isPreviewLanding ? 'block-preview-landing-solid' : ''} ${
                      isFocused ? 'block-focused' : ''
                    }`}
                    style={
                      isOccupied
                        ? {
                            backgroundColor: block.color,
                            borderColor: block.color,
                            color: textColor,
                          }
                        : isPreviewLanding
                        ? {
                            backgroundColor: '#FFD700',
                            borderColor: '#D4A017',
                            color: '#4A2A00',
                          }
                        : undefined
                    }
                    onClick={() => {
                      if (proc) setActiveInspectorId(proc.id);
                    }}
                    title={
                      isPreviewLanding
                        ? `Incoming ${hoveringProcess?.id} (${hoveringProcess?.name}) entering here!`
                        : isOccupied
                        ? `Block #${block.blockId}: ${block.processName} (${block.processId})`
                        : `Block #${block.blockId}: Free (${BLOCK_SIZE_KB} KB)`
                    }
                  >
                    <div
                      className="block-header-mini"
                      style={{
                        color: isOccupied ? textColor : undefined,
                        opacity: isOccupied ? 0.9 : 0.7,
                      }}
                    >
                      <span className="b-id">#{block.blockId}</span>
                      <span className="b-kb">{block.blockId * BLOCK_SIZE_KB}k</span>
                    </div>

                    <div className="block-center-label">
                      {isPreviewLanding ? (
                        <span className="block-incoming-tag-solid">
                          ➜ {hoveringProcess?.id}
                        </span>
                      ) : isOccupied ? (
                        <div className="block-solid-content">
                          <span
                            className="block-proc-tag-solid"
                            style={{
                              backgroundColor:
                                textColor === '#FFFFFF'
                                  ? 'rgba(255, 255, 255, 0.28)'
                                  : 'rgba(0, 0, 0, 0.16)',
                              color: textColor,
                            }}
                          >
                            {block.processId}
                          </span>
                          <span
                            className="block-proc-name-solid"
                            style={{ color: textColor }}
                            title={block.processName}
                          >
                            {block.processName}
                          </span>
                        </div>
                      ) : (
                        <span className="block-free-dot">Free</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active RAM Process Swap Controls */}
            {ramAllocatedIds.length > 0 && (
              <div className="ram-swapping-controls">
                <span className="swap-ctrl-label">Quick Memory Swapping:</span>
                <div className="swap-buttons-list">
                  {ramAllocatedIds.map((pid) => {
                    const proc = processes.find((p) => p.id === pid);
                    if (!proc) return null;
                    return (
                      <button
                        key={pid}
                        type="button"
                        className="btn-swap-out"
                        onClick={() => handleSwapOut(pid)}
                        title={`Swap ${proc.name} out to free ${proc.sizeKb} KB`}
                      >
                        <RefreshCw size={12} />
                        <span>Swap Out {pid} ({proc.sizeKb}K)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              AREA 3: READY QUEUE (IN-MEMORY RUNNABLE)
             ========================================= */}
          <div className="system-area area-ready card-base" data-component="ready-queue-pipeline">
            <div className="area-header header-ready">
              <div className="area-title-group">
                <div className="hardware-icon-box queue-hw-box">
                  <Clock size={18} className="area-icon" />
                </div>
                <div>
                  <h4 className="area-title">3. Ready Queue</h4>
                  <span className="area-sub-hardware">Runnable Task Buffer</span>
                </div>
              </div>
              <span className="area-badge-count">{readyQueue.length} Queued</span>
            </div>

            <p className="area-desc">
              Processes resident in RAM waiting for CPU time slices.
            </p>

            <div className="ready-queue-stream">
              {readyQueue.length === 0 ? (
                <div className="empty-ready-notice">
                  <span>No processes in Ready Queue</span>
                  <p>Admitted RAM processes line up here for scheduling.</p>
                </div>
              ) : (
                readyQueue.map((pid, idx) => {
                  const proc = processes.find((p) => p.id === pid);
                  if (!proc) return null;
                  const isInspected = inspectedProcess?.id === proc.id;

                  return (
                    <div
                      key={`${proc.id}-${idx}`}
                      className={`ready-queue-item-card ${isInspected ? 'card-inspected' : ''}`}
                      style={{ borderLeftColor: proc.color }}
                      onClick={() => setActiveInspectorId(proc.id)}
                    >
                      <div className="ready-pos-badge">#{idx + 1} Next</div>
                      <div className="token-top-row">
                        <span className="token-pid" style={{ backgroundColor: proc.color }}>
                          {proc.id}
                        </span>
                        <span className="token-name">{proc.name}</span>
                      </div>
                      <div className="ready-item-meta">
                        <span>Blocks {proc.startBlock}–{proc.startBlock + proc.blocksCount - 1}</span>
                        <span>{proc.remainingTicks} ticks</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================
              AREA 4: CPU EXECUTION CORE
             ========================================= */}
          <div className="system-area area-cpu card-base" data-component="cpu-core-pipeline">
            <div className="area-header header-cpu">
              <div className="area-title-group">
                <div className="hardware-icon-box cpu-hw-box">
                  <Cpu size={18} className="area-icon" />
                </div>
                <div>
                  <h4 className="area-title">4. CPU Core #0</h4>
                  <span className="area-sub-hardware">Execution Pipeline</span>
                </div>
              </div>
              <span className={`cpu-status-pill ${activeCpuProcess ? 'status-active' : 'status-idle'}`}>
                {activeCpuProcess ? 'Active' : 'Idle'}
              </span>
            </div>

            <p className="area-desc">Hardware processing instructions for the dispatched task.</p>

            <div className="cpu-stage-viewport">
              {activeCpuProcess ? (
                <div
                  className="cpu-running-card"
                  style={{ borderLeftColor: activeCpuProcess.color }}
                  onClick={() => setActiveInspectorId(activeCpuProcess.id)}
                >
                  <div className="cpu-card-title-row">
                    <span className="cpu-pid-chip" style={{ backgroundColor: activeCpuProcess.color }}>
                      {activeCpuProcess.id}
                    </span>
                    <strong className="cpu-proc-title">{activeCpuProcess.name}</strong>
                  </div>

                  <div className="cpu-progress-section">
                    <div className="cpu-progress-header">
                      <span>Execution Progress</span>
                      <span>
                        {activeCpuProcess.burstTicks - activeCpuProcess.remainingTicks} / {activeCpuProcess.burstTicks} Ticks
                      </span>
                    </div>
                    <div className="cpu-progress-track">
                      <div
                        className="cpu-progress-bar-fill"
                        style={{
                          width: `${Math.round(
                            ((activeCpuProcess.burstTicks - activeCpuProcess.remainingTicks) /
                              activeCpuProcess.burstTicks) *
                              100
                          )}%`,
                          backgroundColor: activeCpuProcess.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="cpu-specs-row">
                    <span>RAM: {activeCpuProcess.sizeKb} KB</span>
                    <span>Remaining: {activeCpuProcess.remainingTicks} ticks</span>
                  </div>
                </div>
              ) : (
                <div className="cpu-idle-display">
                  <Cpu size={36} className="cpu-idle-icon" />
                  <strong>CPU is currently IDLE</strong>
                  <p>Click "Step Forward" or "Start Simulation" to dispatch the next Ready process.</p>
                </div>
              )}
            </div>

            {/* Terminated Completed Log */}
            <div className="terminated-summary-box">
              <div className="term-header">
                <CheckCircle2 size={14} className="term-icon" />
                <span>Terminated & Released ({terminatedQueue.length})</span>
              </div>
              <div className="term-chips-list">
                {terminatedQueue.length === 0 ? (
                  <span className="term-none">No finished processes yet</span>
                ) : (
                  terminatedQueue.slice(0, 5).map((pid, idx) => (
                    <span key={`${pid}-${idx}`} className="term-pid-chip">
                      {pid} ✓
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Inspector & Educational Guide Split */}
      <div className="simulator-bottom-split">
        {/* Selected Process Inspector Drawer */}
        <div className="inspector-card card-base" data-component="process-inspector">
          <div className="inspector-card-header">
            <h4 className="ins-title">Process State Inspector</h4>
            {inspectedProcess && (
              <span className="ins-pid-tag" style={{ backgroundColor: inspectedProcess.color }}>
                {inspectedProcess.id}
              </span>
            )}
          </div>

          {inspectedProcess ? (
            <div className="inspector-body">
              <div className="ins-row">
                <span className="ins-key">Process Name</span>
                <strong className="ins-val">{inspectedProcess.name}</strong>
              </div>
              <div className="ins-row">
                <span className="ins-key">Current Location</span>
                <span className={`ins-state-pill state-${inspectedProcess.state.toLowerCase()}`}>
                  {inspectedProcess.state.replace('_', ' ')}
                </span>
              </div>
              <div className="ins-row">
                <span className="ins-key">Memory Requirement</span>
                <span className="ins-val font-mono">{inspectedProcess.sizeKb} KB ({Math.ceil(inspectedProcess.sizeKb / BLOCK_SIZE_KB)} blocks)</span>
              </div>
              <div className="ins-row">
                <span className="ins-key">Allocated RAM Range</span>
                <span className="ins-val font-mono">
                  {inspectedProcess.startBlock !== null && inspectedProcess.startBlock !== undefined
                    ? `Blocks ${inspectedProcess.startBlock} to ${inspectedProcess.startBlock + inspectedProcess.blocksCount - 1}`
                    : 'None (On Disk / Swapped)'}
                </span>
              </div>
              <div className="ins-row">
                <span className="ins-key">CPU Burst Time</span>
                <span className="ins-val font-mono">{inspectedProcess.burstTicks} ticks ({inspectedProcess.remainingTicks} left)</span>
              </div>

              {/* Inspector Action Buttons */}
              <div className="inspector-actions">
                {inspectedProcess.state === 'RAM_READY' && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => handleSwapOut(inspectedProcess.id)}
                  >
                    <RefreshCw size={14} />
                    <span>Swap Out to Disk</span>
                  </button>
                )}
                {inspectedProcess.state === 'SWAPPED' && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => handleSwapIn(inspectedProcess.id)}
                  >
                    <RefreshCw size={14} />
                    <span>Swap In to RAM</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="inspector-empty">Click on any process card to inspect its internal state.</div>
          )}
        </div>

        {/* Educational Callout: Swapping vs Paging */}
        <div className="swapping-vs-paging-card card-base" data-component="swapping-vs-paging">
          <div className="svp-header">
            <Info size={18} className="svp-icon" />
            <h4 className="svp-title">Core Operating System Concept: Swapping vs. Paging</h4>
          </div>

          <div className="svp-comparison-grid">
            <div className="svp-box">
              <strong className="svp-box-title">Swapping (Demonstrated Here)</strong>
              <p className="svp-box-text">
                The operating system moves an <strong>entire process</strong> (all its code, data, and stack) between physical RAM and secondary storage (swap space). It is used by the Medium-Term Scheduler to relieve severe memory pressure.
              </p>
            </div>

            <div className="svp-box">
              <strong className="svp-box-title">Paging (Demand Paging)</strong>
              <p className="svp-box-text">
                The operating system divides memory into small, uniform <strong>pages and frames</strong> (typically 4 KB). Only individual pages are loaded or evicted on demand, eliminating external fragmentation completely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Process Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="create-process-modal card-base">
            <h3 className="modal-heading">Create New Simulated Process</h3>
            <p className="modal-subheading">
              New processes will initially enter Secondary Storage awaiting RAM admission.
            </p>

            <form onSubmit={handleCreateProcess} className="modal-form">
              <div className="modal-field">
                <label htmlFor="proc-name">Application Name</label>
                <input
                  id="proc-name"
                  type="text"
                  placeholder="e.g. 3D Model Renderer"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label htmlFor="proc-size">RAM Requirement (KB)</label>
                <select
                  id="proc-size"
                  value={newProcSize}
                  onChange={(e) => setNewProcSize(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={32}>32 KB (1 Block)</option>
                  <option value={64}>64 KB (2 Blocks)</option>
                  <option value={96}>96 KB (3 Blocks)</option>
                  <option value={128}>128 KB (4 Blocks)</option>
                  <option value={160}>160 KB (5 Blocks)</option>
                  <option value={192}>192 KB (6 Blocks)</option>
                </select>
              </div>

              <div className="modal-field">
                <label htmlFor="proc-burst">CPU Execution Time (Ticks)</label>
                <select
                  id="proc-burst"
                  value={newProcBurst}
                  onChange={(e) => setNewProcBurst(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={2}>2 Ticks (Fast Job)</option>
                  <option value={4}>4 Ticks (Standard)</option>
                  <option value={6}>6 Ticks (Compute Heavy)</option>
                  <option value={8}>8 Ticks (Long Running)</option>
                </select>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Enqueue in Storage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
