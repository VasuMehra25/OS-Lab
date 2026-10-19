import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, BookOpen, Layers, Cpu, HardDrive, FolderTree } from 'lucide-react';
import { CATEGORIES, CONCEPTS } from '../data/conceptsData';
import { useLearningProgress } from '../hooks/useLearningProgress';
import './LearnPage.css';

const ICON_MAP = {
  Cpu,
  Layers,
  HardDrive,
  FolderTree,
};

export function LearnPage() {
  const { isCompleted, getCategoryProgress, getTotalProgress } = useLearningProgress();
  const { completed, total, percent } = getTotalProgress();

  return (
    <div className="learn-page-container container" data-component="learn-page">
      {/* Header */}
      <div className="learn-header">
        <div className="learn-title-block">
          <span className="learn-eyebrow">Interactive Curriculum</span>
          <h1 className="learn-title">Operating Systems Syllabus</h1>
          <p className="learn-subtitle">
            Eight essential core computer science concepts across process, memory, device, and file management.
          </p>
        </div>

        {/* Global Progress Card */}
        <div className="learn-progress-card card-base">
          <div className="learn-progress-stats">
            <span className="stats-label">Curriculum Completion</span>
            <span className="stats-numbers">
              <strong>{completed}</strong> / {total} Mastered
            </span>
          </div>
          <div className="learn-progress-track">
            <div className="learn-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* Categories Curriculum Breakdown */}
      <div className="curriculum-categories-list">
        {CATEGORIES.map((category) => {
          const IconComp = ICON_MAP[category.iconName] || Cpu;
          const catProgress = getCategoryProgress(category.id);

          return (
            <section
              key={category.id}
              id={category.id}
              className="category-curriculum-section card-base"
              data-component="category-curriculum"
            >
              {/* Category Header */}
              <div className="category-section-header">
                <div className="cat-title-wrap">
                  <div
                    className="cat-icon-box"
                    style={{
                      backgroundColor: category.accentBg,
                      borderColor: category.accentBorder,
                      color: category.accentColor,
                    }}
                  >
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h2 className="cat-heading">{category.title}</h2>
                    <p className="cat-summary">{category.shortDescription}</p>
                  </div>
                </div>

                <div className="cat-progress-pill">
                  <CheckCircle2
                    size={14}
                    className={catProgress.completed === catProgress.total ? 'icon-done' : 'icon-open'}
                  />
                  <span>
                    {catProgress.completed} / {catProgress.total} Concepts
                  </span>
                </div>
              </div>

              {/* Concepts List Grid */}
              <div className="concepts-list-grid">
                {category.concepts.map((conceptId) => {
                  const concept = CONCEPTS[conceptId];
                  if (!concept) return null;
                  const completed = isCompleted(conceptId);

                  return (
                    <Link
                      key={conceptId}
                      to={concept.path}
                      className="concept-curriculum-card card-base"
                      data-component="concept-card"
                    >
                      <div className="concept-card-top-row">
                        <span className="concept-card-badge">{concept.badge}</span>
                        {completed ? (
                          <span className="mastery-status-pill status-completed">
                            <CheckCircle2 size={12} />
                            Mastered
                          </span>
                        ) : (
                          <span className="mastery-status-pill status-ready">
                            <Circle size={10} />
                            Ready
                          </span>
                        )}
                      </div>

                      <h3 className="concept-card-title">{concept.title}</h3>
                      <p className="concept-card-desc">{concept.shortDescription}</p>

                      <div className="concept-card-action-row">
                        <span className="launch-text">Launch Simulation</span>
                        <ArrowRight size={15} className="launch-arrow" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Prominent Live Simulator Callout inside Process & Memory categories */}
              {(category.id === 'process-management' || category.id === 'memory-management') && (
                <div className="cat-simulator-feature-card">
                  <div className="sim-feature-left">
                    <span className="sim-pill-tag">Interactive Movement Feature</span>
                    <strong className="sim-feature-title">
                      {category.id === 'process-management'
                        ? 'Simulate Live Process State Movement'
                        : 'Simulate Live Contiguous RAM Allocation & Swapping'}
                    </strong>
                    <p className="sim-feature-desc">
                      Experience the live interactive pipeline: watch processes move through Secondary Storage, occupy RAM blocks, line up in the Ready Queue, execute on CPU Core #0, and swap when memory is full.
                    </p>
                  </div>
                  <Link to="/simulator" className="btn-primary btn-sm btn-cat-sim">
                    <span>Launch Live Simulator</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
