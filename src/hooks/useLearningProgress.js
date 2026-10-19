import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, CONCEPTS } from '../data/conceptsData';

const STORAGE_KEY = 'os_inside_completed_concepts';

export function useLearningProgress() {
  const [completedList, setCompletedList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedList));
    } catch (e) {
      console.warn('Failed to persist progress to localStorage:', e);
    }
  }, [completedList]);

  const markCompleted = useCallback((conceptId) => {
    setCompletedList((prev) => {
      if (prev.includes(conceptId)) return prev;
      return [...prev, conceptId];
    });
  }, []);

  const isCompleted = useCallback(
    (conceptId) => completedList.includes(conceptId),
    [completedList]
  );

  const getCategoryProgress = useCallback(
    (categoryId) => {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (!category) return { completed: 0, total: 0, percent: 0 };
      const total = category.concepts.length;
      const completed = category.concepts.filter((cid) => completedList.includes(cid)).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percent };
    },
    [completedList]
  );

  const getTotalProgress = useCallback(() => {
    const total = Object.keys(CONCEPTS).length;
    const completed = completedList.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [completedList]);

  const resetAllProgress = useCallback(() => {
    setCompletedList([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    completedList,
    markCompleted,
    isCompleted,
    getCategoryProgress,
    getTotalProgress,
    resetAllProgress,
  };
}
