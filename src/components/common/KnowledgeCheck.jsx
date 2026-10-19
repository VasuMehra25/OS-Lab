import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Award } from 'lucide-react';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import './KnowledgeCheck.css';

export function KnowledgeCheck({ conceptId, knowledgeCheck }) {
  const { isCompleted, markCompleted } = useLearningProgress();
  const alreadyCompleted = isCompleted(conceptId);

  const [selectedOption, setSelectedOption] = useState(
    alreadyCompleted ? knowledgeCheck.correctIndex : null
  );
  const [submitted, setSubmitted] = useState(alreadyCompleted);

  const isCorrect = submitted && selectedOption === knowledgeCheck.correctIndex;

  const handleSelect = (index) => {
    if (submitted && isCorrect) return; // Locked once answered correctly
    setSelectedOption(index);
    setSubmitted(false);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    if (selectedOption === knowledgeCheck.correctIndex) {
      markCompleted(conceptId);
    }
  };

  return (
    <section className="knowledge-check-card card-base" data-component="knowledge-check">
      {/* Card Header */}
      <div className="knowledge-check-header">
        <div className="kc-badge-group">
          <div className="kc-icon-wrapper">
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="kc-heading">Knowledge Check</h3>
            <p className="kc-subheading">Test your understanding to earn topic mastery</p>
          </div>
        </div>

        {alreadyCompleted && (
          <div className="kc-mastery-badge" data-component="mastery-badge">
            <Award size={15} />
            <span>Concept Mastered</span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="kc-question-box">
        <p className="kc-question-text">{knowledgeCheck.question}</p>
      </div>

      {/* Options List */}
      <div className="kc-options-list" role="radiogroup" aria-label="Knowledge check answers">
        {knowledgeCheck.options.map((optionText, index) => {
          let optionClass = 'kc-option-item';
          if (selectedOption === index) optionClass += ' selected';
          if (submitted) {
            if (index === knowledgeCheck.correctIndex) {
              optionClass += ' correct';
            } else if (selectedOption === index) {
              optionClass += ' incorrect';
            }
          }

          return (
            <button
              key={index}
              type="button"
              className={optionClass}
              onClick={() => handleSelect(index)}
              role="radio"
              aria-checked={selectedOption === index}
              data-component="knowledge-check-option"
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{optionText}</span>
              {submitted && index === knowledgeCheck.correctIndex && (
                <CheckCircle2 size={18} className="option-icon-correct" />
              )}
              {submitted && selectedOption === index && index !== knowledgeCheck.correctIndex && (
                <XCircle size={18} className="option-icon-incorrect" />
              )}
            </button>
          );
        })}
      </div>

      {/* Submit / Check Action */}
      {!isCorrect && (
        <div className="kc-action-bar">
          <button
            type="button"
            className="btn-primary btn-check-answer"
            onClick={handleCheckAnswer}
            disabled={selectedOption === null}
          >
            Check Answer
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {submitted && (
        <div
          className={`kc-feedback-banner ${isCorrect ? 'banner-correct' : 'banner-incorrect'}`}
          data-component="feedback-banner"
        >
          <div className="banner-header">
            {isCorrect ? (
              <>
                <CheckCircle2 size={20} className="banner-icon-success" />
                <strong>Mastery Unlocked! That is correct.</strong>
              </>
            ) : (
              <>
                <XCircle size={20} className="banner-icon-error" />
                <strong>Not quite. Review the explanation below and try again.</strong>
              </>
            )}
          </div>
          <p className="banner-explanation">{knowledgeCheck.explanation}</p>
        </div>
      )}
    </section>
  );
}
