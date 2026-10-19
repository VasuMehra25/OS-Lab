import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import { KnowledgeCheck } from '../common/KnowledgeCheck';
import './ConceptPageLayout.css';

export function ConceptPageLayout({
  concept,
  simulationControls,
  visualizationContent,
  explanationContent,
  metricsContent,
  interactiveToolbox,
}) {
  const navigate = useNavigate();
  const { isCompleted } = useLearningProgress();
  const completed = isCompleted(concept.id);

  return (
    <div className="concept-page-container" data-component="concept-page-layout">
      {/* 1. Header & Breadcrumbs */}
      <header className="concept-header" data-component="concept-header">
        <div className="concept-breadcrumbs">
          <Link to="/" className="crumb-link">Home</Link>
          <ChevronRight size={14} className="crumb-separator" />
          <Link to="/learn" className="crumb-link">Learn</Link>
          <ChevronRight size={14} className="crumb-separator" />
          <span className="crumb-category">{concept.categoryTitle}</span>
          <ChevronRight size={14} className="crumb-separator" />
          <span className="crumb-current">{concept.title}</span>
        </div>

        <div className="concept-header-main">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/learn')}
            aria-label="Back to curriculum"
          >
            <ArrowLeft size={16} />
            <span>Curriculum</span>
          </button>

          <div className="concept-title-group">
            <div className="concept-badge-row">
              <span className="badge-pill concept-badge">{concept.badge}</span>
              <span className="concept-category-tag">{concept.categoryTitle}</span>
              {completed && (
                <span className="badge-pill concept-completed-badge">
                  <CheckCircle2 size={13} />
                  Mastered
                </span>
              )}
            </div>
            <h1 className="concept-title">{concept.title}</h1>
            <p className="concept-lead">{concept.detailedIntro}</p>
          </div>
        </div>

        {/* Why it Matters Callout */}
        <div className="why-it-matters-banner" data-component="why-it-matters">
          <div className="banner-tag">
            <BookOpen size={16} />
            <span>Why This Matters</span>
          </div>
          <p className="banner-content">{concept.whyItMatters}</p>
        </div>
      </header>

      {/* 2. Simulation Workspace */}
      <main className="simulation-workspace" data-component="simulation-workspace">
        {/* Simulation Controls Toolbar */}
        <div className="workspace-controls-slot">
          {simulationControls}
        </div>

        {/* Optional Interactive Toolbox (e.g. Add Process, Toggle Bits, Select User) */}
        {interactiveToolbox && (
          <div className="workspace-toolbox-slot">
            {interactiveToolbox}
          </div>
        )}

        {/* Large Visualization Canvas & Metrics */}
        <div className="simulation-canvas-area" data-component="simulation-panel">
          {visualizationContent}
        </div>

        {/* Metrics Area */}
        {metricsContent && (
          <div className="simulation-metrics-area" data-component="metrics-panel">
            {metricsContent}
          </div>
        )}

        {/* 3. Step-by-Step Live Inspector (What, Why, Changed, Learned) */}
        <div className="workspace-explanation-slot">
          {explanationContent}
        </div>

        {/* 4. Core Takeaway Note */}
        <div className="concept-key-takeaway card-base" data-component="key-takeaway">
          <div className="takeaway-badge">Key Concept Takeaway</div>
          <p className="takeaway-text">{concept.keyTakeaway}</p>
        </div>

        {/* 5. Interactive Knowledge Check (Persists Completion) */}
        <KnowledgeCheck
          conceptId={concept.id}
          knowledgeCheck={concept.knowledgeCheck}
        />
      </main>
    </div>
  );
}
