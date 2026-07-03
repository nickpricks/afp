import React, { createContext, useContext, useMemo } from 'react';
import {
  useLiveActivity,
  type LiveActivityMetrics,
  type SessionState,
} from '@/modules/body/hooks/useLiveActivity';
import { ActivityType } from '@/shared/types';
import { ProviderMsg } from '@/constants/messages';

type LiveActivityContextType = {
  sessionState: SessionState;
  metrics: LiveActivityMetrics;
  stairsMode: boolean;
  prepare: (type?: ActivityType) => void;
  start: () => Promise<void>;
  stop: () => LiveActivityMetrics;
  cancel: () => void;
  refreshSensors: () => Promise<void>;
  addManualFloor: (direction: 'up' | 'down') => void;
  setStairsMode: (on: boolean) => void;
};

const LiveActivityContext = createContext<LiveActivityContextType | undefined>(undefined);

export function LiveActivityProvider({ children }: { children: React.ReactNode }) {
  const live = useLiveActivity();

  const value = useMemo(
    () => ({
      sessionState: live.sessionState,
      metrics: live.metrics,
      stairsMode: live.stairsMode,
      prepare: live.prepare,
      start: live.start,
      stop: live.stop,
      cancel: live.cancel,
      refreshSensors: live.refreshSensors,
      addManualFloor: live.addManualFloor,
      setStairsMode: live.setStairsMode,
    }),
    [
      live.sessionState,
      live.metrics,
      live.stairsMode,
      live.prepare,
      live.start,
      live.stop,
      live.cancel,
      live.refreshSensors,
      live.addManualFloor,
      live.setStairsMode,
    ],
  );

  return <LiveActivityContext.Provider value={value}>{children}</LiveActivityContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiveActivityContext() {
  const context = useContext(LiveActivityContext);
  if (!context) {
    throw new Error(ProviderMsg.LiveActivityRequired);
  }
  return context;
}
