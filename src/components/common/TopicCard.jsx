import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Layers, HardDrive, FolderTree, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import { CONCEPTS } from '../../data/conceptsData';
import './TopicCard.css';

const ICON_MAP = {
  Cpu,
  Layers,
  HardDrive,
  FolderTree,
};

export function TopicCard({ category }) {
  const { getCategoryProgress, isCompleted } = useLearningProgress();
  const progress = getCategoryProgress(category.id);
  const IconComponent = ICON_MAP[category.iconName] || Cpu;

  return (
    <div
      className="topic-card card-base"
      data-component="topic-card"
      data-category-id={category.id}
    >
      {/* Card Header */}
      <div className="topic-card-header">
        <div
          className="topic-card-icon"
          style={{
            backgroundColor: category.accentBg,
            borderColor: category.accentBorder,
            color: category.accentColor,
          }}
        >
          <IconComponent size={24} />
        </div>
        <div className="topic-card-progress-pill">
          <CheckCircle2
            size={14}
            className={progress.completed === progress.total ? 'icon-complete' : 'icon-pending'}
          />
          <span>
            {progress.completed}/{progress.total} Complete
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="topic-card-body">
        <h3 className="topic-card-title">{category.title}</h3>
        <p className="topic-card-desc">{category.shortDescription}</p>

        {/* Progress Bar */}
        <div className="topic-card-progress-track">
          <div
            className="topic-card-progress-fill"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: category.accentColor,
            }}
          />
        </div>

        {/* Concepts Sub-list */}
        <div className="topic-card-subconcepts">
          {category.concepts.map((conceptId) => {
            const concept = CONCEPTS[conceptId];
            if (!concept) return null;
            const completed = isCompleted(conceptId);

            return (
              <Link
                key={conceptId}
                to={concept.path}
                className="subconcept-link-item"
                data-component="subconcept-link"
              >
                <div className="subconcept-status-dot-wrapper">
                  <span
                    className={`subconcept-dot ${completed ? 'dot-completed' : 'dot-uncompleted'}`}
                  />
                </div>
                <span className="subconcept-name">{concept.title}</span>
                <ArrowRight size={14} className="subconcept-arrow" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="topic-card-footer">
        <Link
          to={`/learn#${category.id}`}
          className="topic-card-action-btn"
          data-component="topic-card-action"
        >
          <span>Explore Category</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
