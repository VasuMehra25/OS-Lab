import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agentation } from 'agentation';

const AgentationContext = createContext({
  isAgentationEnabled: true,
  toggleAgentation: () => {},
});

export function AgentationProvider({ children }) {
  const [isAgentationEnabled, setIsAgentationEnabled] = useState(() => {
    try {
      // 1. Check URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('agentation')) {
        const val = urlParams.get('agentation');
        const enabled = val === 'true' || val === '1';
        localStorage.setItem('os_inside_agentation_enabled', JSON.stringify(enabled));
        return enabled;
      }
      if (urlParams.has('no-agentation') || urlParams.has('clean')) {
        localStorage.setItem('os_inside_agentation_enabled', 'false');
        return false;
      }

      // 2. Default to true (Agentation re-enabled!)
      const saved = localStorage.getItem('os_inside_agentation_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('os_inside_agentation_enabled', JSON.stringify(isAgentationEnabled));
    } catch {
      // ignore
    }
  }, [isAgentationEnabled]);

  const toggleAgentation = () => {
    setIsAgentationEnabled((prev) => !prev);
  };

  return (
    <AgentationContext.Provider value={{ isAgentationEnabled, toggleAgentation }}>
      {children}
      {/* Mount Agentation floating toolbar only when enabled */}
      {isAgentationEnabled && (
        <Agentation
          appName="OS Lab"
          identifyingAttributes={['data-component', 'data-category-id', 'id']}
        />
      )}
    </AgentationContext.Provider>
  );
}

export function useAgentation() {
  return useContext(AgentationContext);
}
