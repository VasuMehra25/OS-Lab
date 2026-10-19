import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSimulationHistory
 * Manages reversible simulation state history, step navigation, and auto-play.
 * 
 * @param {Object} config
 * @param {Object} config.initialState - Initial state snapshot with { state, explanation, stepNumber }
 * @param {Function} config.getNextState - (currentState, ...args) => nextStateSnapshot
 * @param {number} [config.defaultSpeed=2000] - Auto-play interval in ms
 */
export function useSimulationHistory({
  initialSnapshot,
  getNextSnapshot,
  defaultSpeed = 2200,
  canStepNext = (currentSnapshot) => true,
}) {
  // History is an array of immutable snapshots
  const [history, setHistory] = useState([initialSnapshot]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentSnapshot = history[currentIndex] || initialSnapshot;

  // Push a new snapshot into history (truncating any forward redo history if branching)
  const pushSnapshot = useCallback((newSnapshot) => {
    setHistory((prev) => {
      const truncated = prev.slice(0, currentIndex + 1);
      return [...truncated, newSnapshot];
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  // Reset to initial snapshot
  const resetSimulation = useCallback((customInitialSnapshot) => {
    setIsPlaying(false);
    const target = customInitialSnapshot || initialSnapshot;
    setHistory([target]);
    setCurrentIndex(0);
  }, [initialSnapshot]);

  // Step Forward
  const stepForward = useCallback(() => {
    // If we have existing forward history, restore it
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return true;
    }

    // Otherwise generate the next state snapshot if generator provided
    if (getNextSnapshot && canStepNext(currentSnapshot)) {
      const nextSnapshot = getNextSnapshot(currentSnapshot);
      if (nextSnapshot) {
        pushSnapshot(nextSnapshot);
        return true;
      }
    }
    
    // Cannot step forward
    setIsPlaying(false);
    return false;
  }, [currentIndex, history.length, getNextSnapshot, canStepNext, currentSnapshot, pushSnapshot]);

  // Step Backward (Restores exact previous snapshot)
  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex]);

  // Jump to specific step in history
  const jumpToStep = useCallback((index) => {
    setIsPlaying(false);
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
    }
  }, [history.length]);

  // Toggle Auto Play
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Auto-play interval runner
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        const stepped = stepForward();
        if (!stepped) {
          setIsPlaying(false);
        }
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, stepForward]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1 || (getNextSnapshot ? canStepNext(currentSnapshot) : false);

  return {
    currentSnapshot,
    history,
    currentIndex,
    totalSteps: history.length,
    stepNumber: currentIndex + 1,
    isPlaying,
    canGoBack,
    canGoForward,
    playbackSpeed,
    setPlaybackSpeed,
    stepForward,
    stepBackward,
    jumpToStep,
    togglePlay,
    pause,
    resetSimulation,
    pushSnapshot,
  };
}
