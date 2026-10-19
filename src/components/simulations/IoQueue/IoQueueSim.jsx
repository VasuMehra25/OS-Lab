import React, { useState } from 'react';
import { Printer, HardDrive, Plus, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { addIoRequest, switchDeviceType, DEVICE_TYPES } from '../../../simulations/ioQueueEngine';
import './IoQueueSim.css';

export function IoQueueSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const { deviceType, deviceStatus, currentProcessing, queue, completed, totalServed } = state;

  const [procName, setProcName] = useState('');
  const [operation, setOperation] = useState('Print Document.pdf');
  const [duration, setDuration] = useState(3);

  const activeDevice = DEVICE_TYPES[deviceType] || DEVICE_TYPES.PRINTER;

  const handleAddRequest = (e) => {
    e.preventDefault();
    const snap = addIoRequest(currentSnapshot, procName.trim() || undefined, operation.trim() || undefined, Number(duration) || 3);
    onPushSnapshot(snap);
    setProcName('');
  };

  const handleToggleDevice = (type) => {
    const snap = switchDeviceType(currentSnapshot, type);
    onPushSnapshot(snap);
    setOperation(type === 'PRINTER' ? 'Print Document.pdf' : 'Disk Read Sector #2048');
  };

  return (
    <div className="io-queue-sim" data-component="io-queue-sim">
      {/* Device Hardware Controller Switcher */}
      <div className="device-selection-bar">
        <div className="device-toggle-buttons">
          <button
            type="button"
            className={`dev-btn ${deviceType === 'PRINTER' ? 'active' : ''}`}
            onClick={() => handleToggleDevice('PRINTER')}
          >
            <Printer size={16} />
            <span>Laser Printer</span>
          </button>
          <button
            type="button"
            className={`dev-btn ${deviceType === 'DISK' ? 'active' : ''}`}
            onClick={() => handleToggleDevice('DISK')}
          >
            <HardDrive size={16} />
            <span>NVMe Storage Disk</span>
          </button>
        </div>

        <div className="device-status-badge">
          <span className={`status-led ${deviceStatus === 'BUSY' ? 'led-busy' : 'led-idle'}`} />
          <span className="device-status-text">
            Hardware Controller: <strong>{deviceStatus}</strong>
          </span>
          <span className="device-speed-pill">{activeDevice.speedLabel}</span>
        </div>
      </div>

      {/* Main Hardware Station & Active Request */}
      <div className="hardware-station-card card-base" data-component="hardware-station">
        <div className="station-header">
          <div className="station-brand">
            {deviceType === 'PRINTER' ? <Printer size={24} className="station-icon" /> : <HardDrive size={24} className="station-icon" />}
            <div>
              <h4 className="station-title">{activeDevice.name}</h4>
              <span className="station-sub">Single-Channel Hardware Controller</span>
            </div>
          </div>
          <span className="total-served-pill">
            <CheckCircle2 size={14} />
            {totalServed} Requests Completed
          </span>
        </div>

        {/* Current Active Processing Area */}
        <div className="current-servicing-display">
          {currentProcessing ? (
            <div className="active-service-card" style={{ borderLeftColor: currentProcessing.color }}>
              <div className="service-top-row">
                <div className="service-proc-group">
                  <span className="service-req-id" style={{ backgroundColor: currentProcessing.color }}>
                    {currentProcessing.id}
                  </span>
                  <span className="service-proc-name">{currentProcessing.processName}</span>
                </div>
                <div className="service-state-tag">
                  <Loader2 size={14} className="spin-icon" />
                  <span>Processing...</span>
                </div>
              </div>

              <div className="service-op-desc">{currentProcessing.operation}</div>

              {/* Progress gauge */}
              <div className="service-progress-track">
                <div
                  className="service-progress-fill"
                  style={{
                    width: `${Math.round(
                      ((currentProcessing.durationTicks - currentProcessing.remainingTicks) /
                        currentProcessing.durationTicks) *
                        100
                    )}%`,
                    backgroundColor: currentProcessing.color,
                  }}
                />
              </div>

              <div className="service-time-meta">
                <span>
                  Remaining: <strong>{currentProcessing.remainingTicks}</strong> ticks
                </span>
                <span>Total: {currentProcessing.durationTicks} ticks</span>
              </div>
            </div>
          ) : (
            <div className="device-idle-box">
              <span className="idle-indicator-text">Device is currently IDLE. Waiting for I/O requests.</span>
            </div>
          )}
        </div>
      </div>

      {/* I/O Request Queue (Waiting Buffer) */}
      <div className="io-queue-section card-base" data-component="io-request-queue">
        <div className="queue-section-header">
          <div className="queue-title-row">
            <Clock size={16} className="queue-icon" />
            <h4 className="queue-section-title">I/O Request Buffer (FIFO Queue)</h4>
          </div>
          <span className="queue-count-badge">
            {queue.length} {queue.length === 1 ? 'Request' : 'Requests'} Waiting
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="queue-empty-callout">
            <span>The queue is empty. New requests will be serviced immediately without waiting.</span>
          </div>
        ) : (
          <div className="io-queue-items-flow">
            {queue.map((req, idx) => (
              <div key={req.id} className="io-queue-item-card" style={{ borderTopColor: req.color }}>
                <div className="queue-pos-badge">#{idx + 1} in line</div>
                <span className="queue-req-id" style={{ backgroundColor: req.color }}>
                  {req.id}
                </span>
                <span className="queue-proc-name">{req.processName}</span>
                <span className="queue-op-text">{req.operation}</span>
                <span className="queue-duration-tag">{req.durationTicks} ticks needed</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Footer: Submit New Request & Completed History */}
      <div className="io-bottom-split">
        {/* New Request Form */}
        <div className="new-request-card card-base">
          <h4 className="card-sub-title">Submit Asynchronous I/O Request</h4>
          <p className="card-sub-desc">
            Applications submit I/O requests to the device manager without blocking CPU execution.
          </p>

          <form onSubmit={handleAddRequest} className="io-submit-form">
            <div className="form-field">
              <label htmlFor="proc-name-input">Application / Submitting Process</label>
              <input
                id="proc-name-input"
                type="text"
                placeholder="e.g. Document Editor"
                value={procName}
                onChange={(e) => setProcName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="operation-input">Device Operation Payload</label>
              <input
                id="operation-input"
                type="text"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="duration-select">Estimated Transfer Time (Clock Ticks)</label>
              <select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="form-select"
              >
                <option value={2}>2 Ticks (Quick Transfer)</option>
                <option value={3}>3 Ticks (Standard)</option>
                <option value={4}>4 Ticks (Large Payload)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>Enqueue Request</span>
            </button>
          </form>
        </div>

        {/* Completed Requests Log */}
        <div className="completed-log-card card-base">
          <h4 className="card-sub-title">Recently Serviced Requests</h4>
          <span className="card-sub-desc">Processed by hardware device controller</span>

          <div className="completed-items-list">
            {completed.length === 0 ? (
              <span className="empty-completed-note">No completed requests yet.</span>
            ) : (
              completed.map((item, idx) => (
                <div key={idx} className="completed-item-row">
                  <span className="completed-pid" style={{ backgroundColor: item.color }}>
                    {item.id}
                  </span>
                  <div className="completed-meta">
                    <strong>{item.processName}</strong>
                    <span>{item.operation}</span>
                  </div>
                  <span className="completed-badge">Done</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
