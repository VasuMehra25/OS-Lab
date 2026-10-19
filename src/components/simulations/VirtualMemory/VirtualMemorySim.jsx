import React from 'react';
import { Layers, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { requestPage, TOTAL_VIRTUAL_PAGES, TOTAL_PHYSICAL_FRAMES } from '../../../simulations/virtualMemoryEngine';
import './VirtualMemorySim.css';

export function VirtualMemorySim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const {
    pageTable,
    frames,
    referenceString,
    currentRefIndex,
    lastRequestedPage,
    lastResult,
    evictedPage,
    evictedFrame,
    totalRequests,
    pageHits,
    pageFaults,
  } = state;

  const hitRate = totalRequests > 0 ? Math.round((pageHits / totalRequests) * 100) : 0;
  const faultRate = totalRequests > 0 ? Math.round((pageFaults / totalRequests) * 100) : 0;

  const handleManualRequest = (vpn) => {
    const snap = requestPage(currentSnapshot, vpn);
    onPushSnapshot(snap);
  };

  return (
    <div className="virtual-memory-sim" data-component="virtual-memory-sim">
      {/* Top Reference String & Request Strip */}
      <div className="vm-top-request-strip card-base">
        <div className="ref-string-header">
          <span className="ref-title">Reference Stream</span>
          <span className="ref-sub">Click any page number to issue access request</span>
        </div>

        <div className="ref-stream-tokens">
          {referenceString.map((vpn, idx) => {
            const isCurrentInStream = idx === currentRefIndex % referenceString.length;
            return (
              <button
                key={idx}
                type="button"
                className={`ref-token ${isCurrentInStream ? 'token-active-pointer' : ''}`}
                onClick={() => handleManualRequest(vpn)}
                title={`Request Page ${vpn}`}
              >
                <span>P{vpn}</span>
                {isCurrentInStream && <span className="ref-pointer-arrow">▼</span>}
              </button>
            );
          })}
        </div>

        {/* Manual Page Selector Pills */}
        <div className="manual-page-selector">
          <span className="manual-label">Manual Access:</span>
          {Array.from({ length: TOTAL_VIRTUAL_PAGES }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`btn-page-access ${lastRequestedPage === i ? 'btn-page-last' : ''}`}
              onClick={() => handleManualRequest(i)}
            >
              Page {i}
            </button>
          ))}
        </div>
      </div>

      {/* Hit / Fault Status Banner */}
      {lastResult && (
        <div
          className={`vm-result-banner ${lastResult === 'HIT' ? 'banner-hit' : 'banner-fault'}`}
          data-component="page-result-banner"
        >
          {lastResult === 'HIT' ? (
            <>
              <CheckCircle2 size={20} className="res-icon" />
              <div>
                <strong>PAGE HIT on Virtual Page {lastRequestedPage}!</strong>
                <p>Found immediately in Physical Frame {pageTable[lastRequestedPage]?.pfn}. Zero disk I/O delay.</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={20} className="res-icon" />
              <div>
                <strong>PAGE FAULT on Virtual Page {lastRequestedPage}!</strong>
                <p>
                  {evictedPage !== null
                    ? `FIFO Eviction: Discarded Page ${evictedPage} from Frame ${evictedFrame} to load Page ${lastRequestedPage}.`
                    : `Loaded Page ${lastRequestedPage} from secondary disk into empty Frame ${pageTable[lastRequestedPage]?.pfn}.`}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Three Column Side-by-Side: Virtual Pages | Page Table | Physical RAM Frames */}
      <div className="vm-three-column-grid">
        {/* 1. Virtual Address Space */}
        <div className="vm-column card-base" data-component="virtual-pages">
          <div className="vm-col-header">
            <h4 className="vm-col-title">Virtual Pages (Process)</h4>
            <span className="vm-col-sub">{TOTAL_VIRTUAL_PAGES} Pages (0–7)</span>
          </div>

          <div className="virtual-pages-list">
            {pageTable.map((pt) => {
              const isResident = pt.valid;
              const isLastTarget = lastRequestedPage === pt.vpn;

              return (
                <div
                  key={pt.vpn}
                  className={`virtual-page-item ${isResident ? 'page-resident' : 'page-on-disk'} ${
                    isLastTarget ? 'page-targeted' : ''
                  }`}
                  onClick={() => handleManualRequest(pt.vpn)}
                >
                  <span className="vpage-label">Virtual Page {pt.vpn}</span>
                  <span className="vpage-status">
                    {isResident ? `Frame ${pt.pfn}` : 'On Disk'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Page Table (Translation Mechanism) */}
        <div className="vm-column card-base" data-component="page-table">
          <div className="vm-col-header">
            <h4 className="vm-col-title">Page Table (MMU)</h4>
            <span className="vm-col-sub">Hardware Map</span>
          </div>

          <table className="page-table-data">
            <thead>
              <tr>
                <th>VPN</th>
                <th>Frame (PFN)</th>
                <th>Valid Bit</th>
              </tr>
            </thead>
            <tbody>
              {pageTable.map((pt) => (
                <tr
                  key={pt.vpn}
                  className={lastRequestedPage === pt.vpn ? 'row-table-target' : ''}
                >
                  <td>
                    <strong>P{pt.vpn}</strong>
                  </td>
                  <td>
                    {pt.pfn !== null ? (
                      <span className="pfn-pill">Frame {pt.pfn}</span>
                    ) : (
                      <span className="pfn-null">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`valid-bit ${pt.valid ? 'bit-valid' : 'bit-invalid'}`}>
                      {pt.valid ? '1 (In RAM)' : '0 (Fault)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Physical RAM Frames */}
        <div className="vm-column card-base" data-component="physical-frames">
          <div className="vm-col-header">
            <h4 className="vm-col-title">Physical RAM Frames</h4>
            <span className="vm-col-sub">{TOTAL_PHYSICAL_FRAMES} Frames (0–3)</span>
          </div>

          <div className="physical-frames-list">
            {frames.map((frame) => {
              const hasPage = frame.vpn !== null;
              const isLastTargetFrame =
                lastRequestedPage !== null && pageTable[lastRequestedPage]?.pfn === frame.frameId;

              return (
                <div
                  key={frame.frameId}
                  className={`physical-frame-item ${hasPage ? 'frame-filled' : 'frame-vacant'} ${
                    isLastTargetFrame ? 'frame-targeted' : ''
                  }`}
                >
                  <div className="frame-meta-row">
                    <span className="frame-id-badge">Frame #{frame.frameId}</span>
                    {frame.loadOrder && <span className="frame-load-order">Load #{frame.loadOrder}</span>}
                  </div>

                  <div className="frame-payload">
                    {hasPage ? (
                      <>
                        <span className="frame-page-tag">Virtual Page {frame.vpn}</span>
                        <span className="frame-address-range font-mono">
                          0x{frame.frameId * 4096} - 0x{(frame.frameId + 1) * 4096 - 1}
                        </span>
                      </>
                    ) : (
                      <span className="frame-vacant-text">Empty Frame</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Hit / Fault Performance Metrics */}
      <div className="vm-metrics-footer card-base" data-component="metrics-panel">
        <div className="vm-metric-chip">
          <span className="chip-label">Total References</span>
          <span className="chip-val">{totalRequests}</span>
        </div>
        <div className="vm-metric-chip">
          <span className="chip-label">Page Hits</span>
          <span className="chip-val text-hit">{pageHits}</span>
        </div>
        <div className="vm-metric-chip">
          <span className="chip-label">Page Faults</span>
          <span className="chip-val text-fault">{pageFaults}</span>
        </div>
        <div className="vm-metric-chip">
          <span className="chip-label">Hit Ratio</span>
          <span className="chip-val">{hitRate}%</span>
        </div>
        <div className="vm-metric-chip">
          <span className="chip-label">Fault Ratio</span>
          <span className="chip-val">{faultRate}%</span>
        </div>
      </div>
    </div>
  );
}
