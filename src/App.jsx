import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { ConceptPage } from './pages/ConceptPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AgentationProvider } from './context/AgentationContext';

export function App() {
  return (
    <ErrorBoundary>
      <AgentationProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="learn/:conceptId" element={<ConceptPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AgentationProvider>
    </ErrorBoundary>
  );
}

export default App;
