import React from 'react';
import { HelpCircle, Sparkles, RefreshCw, GraduationCap } from 'lucide-react';
import './StepExplanation.css';

export function StepExplanation({ explanation, actionTitle }) {
  if (!explanation) return null;

  const { what, why, changed, learned } = explanation;

  return (
    <div className="step-explanation card-base" data-component="step-explanation">
      {/* Header bar */}
      <div className="step-explanation-header">
        <div className="header-badge-group">
          <span className="step-explanation-tag">Live OS Inspector</span>
          {actionTitle && <span className="action-pill">{actionTitle}</span>}
        </div>
        <span className="step-explanation-sub">Step-by-step state transition breakdown</span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="explanation-pillars-grid">
        {/* 1. What is happening? */}
        <div className="pillar-card pillar-what">
          <div className="pillar-header">
            <div className="pillar-icon-wrap icon-what">
              <Sparkles size={16} />
            </div>
            <h4 className="pillar-title">1. What is happening?</h4>
          </div>
          <p className="pillar-text">{what}</p>
        </div>

        {/* 2. Why is it happening? */}
        <div className="pillar-card pillar-why">
          <div className="pillar-header">
            <div className="pillar-icon-wrap icon-why">
              <HelpCircle size={16} />
            </div>
            <h4 className="pillar-title">2. Why is it happening?</h4>
          </div>
          <p className="pillar-text">{why}</p>
        </div>

        {/* 3. What changed? */}
        <div className="pillar-card pillar-changed">
          <div className="pillar-header">
            <div className="pillar-icon-wrap icon-changed">
              <RefreshCw size={16} />
            </div>
            <h4 className="pillar-title">3. What changed?</h4>
          </div>
          <p className="pillar-text">{changed}</p>
        </div>

        {/* 4. What should the student learn? */}
        <div className="pillar-card pillar-learn">
          <div className="pillar-header">
            <div className="pillar-icon-wrap icon-learn">
              <GraduationCap size={16} />
            </div>
            <h4 className="pillar-title">4. Key Learning Takeaway</h4>
          </div>
          <p className="pillar-text">{learned}</p>
        </div>
      </div>
    </div>
  );
}
