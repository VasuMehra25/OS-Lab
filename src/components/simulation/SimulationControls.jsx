import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import './SimulationControls.css';

export function SimulationControls({
  canGoBack,
  canGoForward,
  onStepBackward,
  onStepForward,
  isPlaying,
  onTogglePlay,
  onReset,
  stepNumber,
  totalSteps,
  playbackSpeed,
  onSpeedChange,
  extraControls,
}) {
  return (
    <div className="simulation-controls card-base" data-component="simulation-controls">
      {/* Step Info Badge */}
      <div className="controls-step-info">
        <span className="step-label">Current Step</span>
        <span className="step-badge">
          Step <strong>{stepNumber}</strong>
          {totalSteps > 1 && <span className="step-total"> of {totalSteps}</span>}
        </span>
      </div>

      {/* Main Action Buttons */}
      <div className="controls-buttons-group">
        {/* Previous Step */}
        <button
          type="button"
          className="ctrl-btn ctrl-btn-step"
          onClick={onStepBackward}
          disabled={!canGoBack}
          title="Previous Step (Restore previous state)"
          aria-label="Previous Step"
          data-component="btn-previous-step"
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>

        {/* Auto Play / Pause */}
        <button
          type="button"
          className={`ctrl-btn ctrl-btn-play ${isPlaying ? 'is-playing' : ''}`}
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause auto-play' : 'Auto Play simulation'}
          aria-label={isPlaying ? 'Pause' : 'Auto Play'}
          data-component="btn-autoplay"
        >
          {isPlaying ? (
            <>
              <Pause size={18} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Auto Play</span>
            </>
          )}
        </button>

        {/* Next Step */}
        <button
          type="button"
          className="ctrl-btn ctrl-btn-step"
          onClick={onStepForward}
          disabled={!canGoForward && !isPlaying}
          title="Next Step"
          aria-label="Next Step"
          data-component="btn-next-step"
        >
          <span>Next</span>
          <ChevronRight size={18} />
        </button>

        {/* Reset */}
        <button
          type="button"
          className="ctrl-btn ctrl-btn-reset"
          onClick={onReset}
          title="Reset simulation to initial state"
          aria-label="Reset Simulation"
          data-component="btn-reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Options or Custom Controls */}
      <div className="controls-auxiliary-group">
        {onSpeedChange && (
          <div className="speed-selector-wrapper">
            <span className="speed-label">Speed:</span>
            <select
              className="speed-select"
              value={playbackSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              aria-label="Playback speed"
            >
              <option value={3000}>0.7x (Slow)</option>
              <option value={2000}>1x (Normal)</option>
              <option value={1000}>2x (Fast)</option>
            </select>
          </div>
        )}

        {extraControls && <div className="extra-controls-slot">{extraControls}</div>}
      </div>
    </div>
  );
}
