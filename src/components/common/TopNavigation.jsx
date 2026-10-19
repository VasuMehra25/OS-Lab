import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, CheckCircle2 } from 'lucide-react';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import { useAgentation } from '../../context/AgentationContext';
import './TopNavigation.css';

export function TopNavigation() {
  const location = useLocation();
  const { isAgentationEnabled, toggleAgentation } = useAgentation();
  const { getTotalProgress } = useLearningProgress();
  const { completed, total, percent } = getTotalProgress();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="top-navigation" data-component="top-navigation">
      <div className="container top-nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="top-nav-brand" aria-label="OS Lab Home">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-logo-svg">
              <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#brandGrad)" />
              <rect x="4" y="4" width="24" height="24" rx="6" fill="#0A331B" />
              {/* Terminal & Chip glyphs */}
              <path d="M9 11L14 16L9 21" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="21" x2="23" y2="21" stroke="#9EE8BE" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="21" cy="11" r="2.5" fill="#FFD700" />
              <line x1="16.5" y1="11" x2="18.5" y2="11" stroke="#FFD700" strokeWidth="1.5" />
              <line x1="21" y1="13.5" x2="21" y2="16.5" stroke="#9EE8BE" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
              <defs>
                <linearGradient id="brandGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#18A558" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-title">OS Lab</span>
            <span className="brand-subtitle">Interactive Visualizer</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="top-nav-links" aria-label="Main Navigation">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            data-component="nav-link-home"
          >
            <Home size={16} />
            <span>Home</span>
          </Link>
          <Link
            to="/learn"
            className={`nav-link ${isActive('/learn') ? 'active' : ''}`}
            data-component="nav-link-learn"
          >
            <BookOpen size={16} />
            <span>Learn</span>
          </Link>
          <Link
            to="/simulator"
            className={`nav-link nav-link-simulator ${isActive('/simulator') ? 'active' : ''}`}
            data-component="nav-link-simulator"
          >
            <span className="live-pulse-dot" />
            <span>Live Simulator</span>
          </Link>
        </nav>

        {/* Right Action Cluster: Very Small Agentation Toggle Button + Progress */}
        <div className="top-nav-right-cluster">
          <button
            type="button"
            className={`top-mini-toggle ${isAgentationEnabled ? 'mini-toggle-on' : 'mini-toggle-off'}`}
            onClick={toggleAgentation}
            title={isAgentationEnabled ? 'Agentation: ON (Click to turn OFF)' : 'Agentation: OFF (Click to turn ON)'}
            aria-label="Toggle Agentation"
            data-component="agentation-mini-toggle"
          >
            <span className="mini-toggle-track">
              <span className="mini-toggle-knob" />
            </span>
            <span className="mini-toggle-label">
              Agentation: <strong>{isAgentationEnabled ? 'ON' : 'OFF'}</strong>
            </span>
          </button>

          {/* Learning Progress Indicator Badge */}
          <div className="top-nav-progress" data-component="progress-indicator">
            <div className="progress-badge-pill">
              <CheckCircle2 size={15} className="progress-icon" />
              <span className="progress-text">
                <strong>{completed}</strong> / {total} Mastered
              </span>
              <div className="progress-mini-bar-track">
                <div
                  className="progress-mini-bar-fill"
                  style={{ width: `${percent}%` }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
