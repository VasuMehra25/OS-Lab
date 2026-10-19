import React, { useState, useEffect } from 'react';
import { Crosshair, Check, Copy, Eye, Sliders, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useAgentation } from '../../context/AgentationContext';
import './AgentationToolbar.css';

export function AgentationToolbar() {
  const { isAgentationEnabled, toggleAgentation } = useAgentation();
  const [hoveredTag, setHoveredTag] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedTag, setCopiedTag] = useState(null);

  // When Agentation is enabled, set up visual hover inspector
  useEffect(() => {
    if (!isAgentationEnabled) {
      setHoveredTag(null);
      document.body.classList.remove('agentation-mode-active');
      return;
    }

    document.body.classList.add('agentation-mode-active');

    const handleMouseOver = (e) => {
      // Find closest element with data-component
      const target = e.target.closest('[data-component]');
      if (target && !target.closest('.agentation-floating-bar')) {
        const comp = target.getAttribute('data-component');
        setHoveredTag(comp);
      } else {
        setHoveredTag(null);
      }
    };

    const handleClick = (e) => {
      if (!isAgentationEnabled) return;
      const target = e.target.closest('[data-component]');
      if (target && !target.closest('.agentation-floating-bar') && e.altKey) {
        e.preventDefault();
        const comp = target.getAttribute('data-component');
        if (comp) {
          navigator.clipboard?.writeText?.(`[data-component="${comp}"]`);
          setCopiedTag(comp);
          setTimeout(() => setCopiedTag(null), 2000);
        }
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleClick);
      document.body.classList.remove('agentation-mode-active');
    };
  }, [isAgentationEnabled]);

  if (!isAgentationEnabled) {
    return null;
  }

  return (
    <aside
      className={`agentation-floating-bar is-enabled ${isMinimized ? 'is-minimized' : ''}`}
      aria-label="Agentation UI Inspector Toolbar"
      data-component="agentation-toolbar"
    >
      <div className="agentation-bar-container">
        {/* Main Bar Left: Logo & Status */}
        <div className="agentation-bar-left">
          <div className="agentation-logo-badge">
            <Crosshair size={18} className="agentation-icon" />
            <span className="agentation-brand-title">Agentation</span>
          </div>

          <div className="agentation-status-pill">
            <span className={`status-dot ${isAgentationEnabled ? 'dot-active' : 'dot-inactive'}`} />
            <span className="status-label">
              Inspector: <strong>{isAgentationEnabled ? 'ACTIVE' : 'OFF'}</strong>
            </span>
          </div>
        </div>

        {/* Center: Live Hovered Tag or Prompt Hint */}
        <div className="agentation-bar-center">
          {isAgentationEnabled ? (
            hoveredTag ? (
              <div className="agentation-tag-preview">
                <span className="tag-preview-prefix">Target:</span>
                <code className="tag-preview-code">data-component="{hoveredTag}"</code>
                <span className="tag-hint-alt">(Alt+Click to copy)</span>
              </div>
            ) : (
              <div className="agentation-idle-hint">
                <Sparkles size={14} className="sparkle-hint" />
                <span>Hover over any card, button, or subsystem to inspect component ID</span>
              </div>
            )
          ) : (
            <div className="agentation-off-hint">
              <span>Turn toggle ON to inspect and select UI elements for Agentation prompts</span>
            </div>
          )}

          {copiedTag && (
            <span className="agentation-copied-pill">
              <Check size={12} /> Copied!
            </span>
          )}
        </div>

        {/* Right: Master Toggle Button & Minimize */}
        <div className="agentation-bar-right">
          <button
            type="button"
            className={`agentation-switch-btn ${isAgentationEnabled ? 'switch-on' : 'switch-off'}`}
            onClick={toggleAgentation}
            title={isAgentationEnabled ? 'Disable Agentation Inspector' : 'Enable Agentation Inspector'}
            data-component="agentation-switch"
          >
            <span className="switch-slider-track">
              <span className="switch-slider-thumb" />
            </span>
            <span className="switch-text">{isAgentationEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className="agentation-minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Agentation Toolbar' : 'Minimize Agentation Toolbar'}
            aria-label="Toggle Toolbar Size"
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
