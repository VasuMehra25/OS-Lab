import React, { useState } from 'react';
import { Layers, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { allocateFirstFit, releaseProcess, BLOCK_SIZE_KB } from '../../../simulations/ramAllocationEngine';
import './RamAllocationSim.css';

function getContrastTextColor(hexColor) {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#1A1800' : '#FFFFFF';
}

export function RamAllocationSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const { blocks, allocatedProcesses, totalRamKb, usedRamKb, freeRamKb, externalFragmentation } = state;

  const [procName, setProcName] = useState('');
  const [procSizeKb, setProcSizeKb] = useState(64);

  const handleAllocate = (e) => {
    e.preventDefault();
    const snap = allocateFirstFit(currentSnapshot, procName.trim() || undefined, Number(procSizeKb) || 64);
    onPushSnapshot(snap);
    setProcName('');
  };

  const handleRelease = (pid) => {
    const snap = releaseProcess(currentSnapshot, pid);
    onPushSnapshot(snap);
  };

  const usedPercent = Math.round((usedRamKb / totalRamKb) * 100);

  return (
    <div className="ram-allocation-sim" data-component="ram-allocation-sim">
      {/* Top Memory Status Overview Strip */}
      <div className="memory-stats-bar card-base" data-component="memory-stats">
        <div className="mem-stat-item">
          <span className="mem-stat-label">Total RAM</span>
          <span className="mem-stat-val">{totalRamKb} KB</span>
          <span className="mem-stat-sub">16 blocks × {BLOCK_SIZE_KB} KB</span>
        </div>
        <div className="mem-stat-item">
          <span className="mem-stat-label">Used RAM</span>
          <span className="mem-stat-val mem-used-val">{usedRamKb} KB</span>
          <span className="mem-stat-sub">{usedPercent}% occupied</span>
        </div>
        <div className="mem-stat-item">
          <span className="mem-stat-label">Free RAM</span>
          <span className="mem-stat-val mem-free-val">{freeRamKb} KB</span>
          <span className="mem-stat-sub">{100 - usedPercent}% available</span>
        </div>

        {/* Global Progress Gauge */}
        <div className="mem-gauge-wrapper">
          <div className="mem-gauge-track">
            <div className="mem-gauge-fill" style={{ width: `${usedPercent}%` }} />
          </div>
        </div>
      </div>

      {/* External Fragmentation Warning Banner if detected */}
      {externalFragmentation && (
        <div className="external-frag-alert" data-component="frag-alert">
          <AlertTriangle size={20} className="alert-icon" />
          <div className="alert-text">
            <strong>External Fragmentation Warning!</strong>
            <p>
              Total free memory ({freeRamKb} KB) is theoretically large enough to satisfy requests,
              but it is broken into non-contiguous holes smaller than the requested size.
            </p>
          </div>
        </div>
      )}

      {/* Large Visual RAM Grid */}
      <div className="ram-grid-section card-base" data-component="ram-visualization">
        <div className="ram-grid-header">
          <div className="grid-title-group">
            <Layers size={18} className="grid-icon" />
            <h4 className="ram-grid-title">Physical RAM Address Blocks</h4>
          </div>
          <span className="ram-grid-legend">
            <span className="legend-chip legend-free">Free Hole</span>
            <span className="legend-chip legend-user">Allocated Process</span>
          </span>
        </div>

        {/* 16 Blocks Grid */}
        <div className="ram-blocks-grid">
          {blocks.map((block) => {
            const isAllocated = block.processId !== null;
            const textColor = isAllocated ? getContrastTextColor(block.color) : undefined;

            return (
              <div
                key={block.blockId}
                className={`ram-block-slot ${isAllocated ? 'block-occupied block-occupied-solid' : 'block-free block-free-solid'}`}
                style={
                  isAllocated
                    ? {
                        backgroundColor: block.color,
                        borderColor: block.color,
                        color: textColor,
                        boxShadow: `0 3px 8px ${block.color}50`,
                      }
                    : undefined
                }
                title={
                  isAllocated
                    ? `Block ${block.blockId}: ${block.processName} (${block.processId})`
                    : `Block ${block.blockId}: Free (${BLOCK_SIZE_KB} KB)`
                }
              >
                <div
                  className="block-top-row"
                  style={{
                    color: isAllocated ? textColor : undefined,
                    opacity: isAllocated ? 0.9 : 0.7,
                  }}
                >
                  <span className="block-idx">#{block.blockId}</span>
                  <span className="block-size-tag">
                    {block.blockId * BLOCK_SIZE_KB} KB
                  </span>
                </div>

                <div className="block-content">
                  {isAllocated ? (
                    <div className="block-solid-details">
                      <span
                        className="block-proc-pill-solid"
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
                      <span className="block-proc-name-solid" style={{ color: textColor }}>
                        {block.processName}
                      </span>
                    </div>
                  ) : (
                    <span className="block-free-tag-solid">FREE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Manual Allocation Form & Active Processes List with Release buttons */}
      <div className="ram-actions-split">
        {/* Allocation Form */}
        <div className="ram-form-card card-base">
          <h4 className="form-card-title">Allocate Memory (First-Fit)</h4>
          <p className="form-card-sub">
            The OS scans RAM from Block 0 and selects the first contiguous hole that fits.
          </p>

          <form onSubmit={handleAllocate} className="ram-alloc-form">
            <div className="form-field">
              <label htmlFor="proc-name-input">Application / Process Name</label>
              <input
                id="proc-name-input"
                type="text"
                placeholder="e.g. Media Player"
                value={procName}
                onChange={(e) => setProcName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="proc-size-select">Memory Requirement</label>
              <select
                id="proc-size-select"
                value={procSizeKb}
                onChange={(e) => setProcSizeKb(Number(e.target.value))}
                className="form-select"
              >
                <option value={32}>32 KB (1 block)</option>
                <option value={64}>64 KB (2 blocks)</option>
                <option value={96}>96 KB (3 blocks)</option>
                <option value={128}>128 KB (4 blocks)</option>
                <option value={160}>160 KB (5 blocks)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary btn-alloc-submit">
              <Plus size={16} />
              <span>Allocate Blocks</span>
            </button>
          </form>
        </div>

        {/* Active Processes in RAM & Release action */}
        <div className="ram-procs-card card-base">
          <div className="procs-card-header">
            <h4 className="form-card-title">Active Partitions in RAM</h4>
            <span className="procs-count-tag">{allocatedProcesses.length} Allocations</span>
          </div>

          <div className="allocated-procs-list">
            {allocatedProcesses.map((proc) => (
              <div key={proc.id} className="allocated-proc-item" style={{ borderLeftColor: proc.color }}>
                <div className="alloc-item-info">
                  <div className="alloc-item-title-row">
                    <span
                      className="alloc-pid-badge"
                      style={{ backgroundColor: proc.color, color: '#FFFFFF' }}
                    >
                      {proc.id}
                    </span>
                    <strong className="alloc-proc-name">{proc.name}</strong>
                  </div>
                  <span className="alloc-item-meta">
                    Occupies Blocks {proc.startBlock}–{proc.startBlock + proc.blocksUsed - 1} (
                    {proc.blocksUsed * BLOCK_SIZE_KB} KB)
                    {proc.internalFragKb > 0 && ` • ${proc.internalFragKb} KB internal frag`}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-release-proc"
                  onClick={() => handleRelease(proc.id)}
                  title={`Release memory owned by ${proc.id}`}
                  aria-label={`Release memory for ${proc.id}`}
                >
                  <Trash2 size={15} />
                  <span>Release</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
