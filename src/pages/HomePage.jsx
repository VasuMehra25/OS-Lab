import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/conceptsData';
import { TopicCard } from '../components/common/TopicCard';
import { ComputerIllustration } from '../components/common/ComputerIllustration';
import { useLearningProgress } from '../hooks/useLearningProgress';
import './HomePage.css';

export function HomePage() {
  const { getTotalProgress } = useLearningProgress();
  const { completed, total, percent } = getTotalProgress();

  return (
    <div className="home-page-container" data-component="home-page">
      {/* Hero Section */}
      <section className="home-hero-section" data-component="home-hero">
        <div className="container hero-grid">
          <div className="hero-text-content">
            <div className="hero-tag-badge">
              <Sparkles size={14} className="tag-sparkle" />
              <span>Interactive Operating System Curriculum</span>
            </div>

            <h1 className="hero-main-title">
              OS Lab
            </h1>

            <p className="hero-subtitle">
              Explore the computer within. Learn operating systems by watching them work.
            </p>

            <p className="hero-description">
              Step through CPU scheduling, physical RAM allocation, demand paging, hardware interrupts, and virtual file systems through real-time deterministic simulations.
            </p>

            {/* Quick Progress Banner */}
            <div className="hero-progress-callout card-base">
              <div className="progress-callout-header">
                <span className="callout-label">Curriculum Progress</span>
                <span className="callout-val">
                  <strong>{completed}</strong> of {total} Concepts Mastered ({percent}%)
                </span>
              </div>
              <div className="hero-progress-bar-track">
                <div
                  className="hero-progress-bar-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="hero-illustration-col">
            <ComputerIllustration />
          </div>
        </div>
      </section>

      {/* 4 Main Categories Section */}
      <section className="home-categories-section" data-component="categories-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">Core Knowledge Domains</span>
              <h2 className="section-heading">Four Pillars of Operating Systems</h2>
            </div>
            <Link to="/learn" className="btn-secondary btn-sm">
              <span>View All 8 Concepts</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Exactly Four Category Cards */}
          <div className="categories-grid" data-component="categories-grid">
            {CATEGORIES.map((category) => (
              <TopicCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
