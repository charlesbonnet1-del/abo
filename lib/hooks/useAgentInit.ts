'use client';

import { useEffect, useState } from 'react';

interface AgentInitState {
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

/**
 * Hook to ensure agent configurations are initialized for the current user.
 * Call this hook in the dashboard layout to automatically initialize agents.
 */
export function useAgentInit(): AgentInitState {
  const [state, setState] = useState<AgentInitState>({
    loading: true,
    initialized: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function initAgents() {
      try {
        // Check if agents are already initialized
        const checkRes = await fetch('/api/agents/init');
        if (!checkRes.ok) {
          throw new Error('Failed to check agent status');
        }

        const checkData = await checkRes.json();

        if (checkData.initialized) {
          if (mounted) {
            setState({ loading: false, initialized: true, error: null });
          }
          return;
        }

        // Initialize agents if needed
        const initRes = await fetch('/api/agents/init', { method: 'POST' });
        if (!initRes.ok) {
          throw new Error('Failed to initialize agents');
        }

        if (mounted) {
          setState({ loading: false, initialized: true, error: null });
        }
      } catch (err) {
        console.error('Agent initialization error:', err);
        if (mounted) {
          setState({
            loading: false,
            initialized: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    initAgents();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
