import React, { createContext, useContext } from 'react';
import { usePersistedState } from '../storage/usePersistedState';
import { KEYS } from '../storage/store';

export type AppMode = 'beginner' | 'expert';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isExpert: boolean;
  isBeginner: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'beginner',
  setMode: () => {},
  isExpert: false,
  isBeginner: true,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeRaw] = usePersistedState<AppMode>(KEYS.appMode, 'beginner');

  return (
    <ModeContext.Provider value={{
      mode,
      setMode: setModeRaw,
      isExpert: mode === 'expert',
      isBeginner: mode === 'beginner',
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
