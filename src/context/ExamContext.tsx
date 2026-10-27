import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ExamInfo, ExamSettings, ExamState, TokenHistoryItem } from '../types/exam';
import { generateCbtToken, sanitizeToken } from '../utils/tokenGenerator';
import { playTokenUpdateChime } from '../utils/audio';

const STORAGE_KEY = 'smk_assyafi_exam_token_state_v2_tka';
const BROADCAST_CHANNEL_NAME = 'smk_cbt_token_sync_channel';

const defaultExamInfo: ExamInfo = {
  examName: 'Tes Kemampuan Akademik (TKA)',
  subject: 'Tes Kemampuan Akademik (TKA)',
  gradeAndMajor: 'Semua Jurusan — SMK As-Syafi\'iyah',
  roomName: 'Ruang Ujian / Lab Komputer',
  sessionName: 'Sesi 1 (07.30 - 09.30 WIB)',
  proctor1: 'Pengawas Ruang TKA',
  proctor2: 'Proktor CBT',
  cbtUrl: 'https://cbt.smkassyafiiyah.sch.id',
  announcement: 'Kegiatan Tes Kemampuan Akademik (TKA). Kerjakan soal dengan teliti, jujur, dan mandiri.',
};

const defaultSettings: ExamSettings = {
  adminPin: '1234',
  soundEnabled: true,
  tokenDurationMinutes: 15,
  displaySize: 'large',
  highContrast: false,
  focusMode: false,
  iconType: 'graduation',
};

const initialToken = generateCbtToken(6);
const now = Date.now();

const defaultInitialState: ExamState = {
  currentToken: initialToken,
  tokenCreatedAt: now,
  tokenExpiresAt: now + 15 * 60 * 1000,
  examInfo: defaultExamInfo,
  history: [
    {
      id: 'init-' + now,
      token: initialToken,
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000,
      subject: defaultExamInfo.subject,
      session: defaultExamInfo.sessionName,
      notes: 'Token Ujian Awal (Sesi 1)',
    },
  ],
  settings: defaultSettings,
};

interface ExamContextType {
  state: ExamState;
  updateToken: (newToken: string, durationMinutes?: number, notes?: string) => void;
  updateExamInfo: (info: Partial<ExamInfo>) => void;
  updateSettings: (settings: Partial<ExamSettings>) => void;
  clearHistory: () => void;
  restoreToken: (token: string, durationMinutes?: number) => void;
  resetToDefaults: () => void;
  isTokenExpired: boolean;
  remainingMs: number;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExamState>(() => {
    if (typeof window === 'undefined') return defaultInitialState;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultInitialState,
          ...parsed,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          examInfo: { ...defaultExamInfo, ...(parsed.examInfo || {}) },
        };
      }
    } catch (e) {
      console.error('Failed to load exam state from localStorage', e);
    }
    return defaultInitialState;
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Heartbeat clock for token expiration calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save exam state to localStorage', e);
    }
  }, [state]);

  // Sync across tabs with BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_STATE' && event.data.state) {
        setState(event.data.state);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastState = useCallback((newState: ExamState) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ type: 'SYNC_STATE', state: newState });
        channel.close();
      } catch (e) {
        console.warn('Failed to broadcast state', e);
      }
    }
  }, []);

  const updateToken = useCallback(
    (newTokenInput: string, durationMinutes?: number, notes?: string) => {
      const sanitized = sanitizeToken(newTokenInput);
      if (!sanitized) return;

      const creationTime = Date.now();
      const duration =
        durationMinutes !== undefined ? durationMinutes : state.settings.tokenDurationMinutes;
      const expirationTime = duration > 0 ? creationTime + duration * 60 * 1000 : null;

      const historyItem: TokenHistoryItem = {
        id: 'token-' + creationTime,
        token: sanitized,
        createdAt: creationTime,
        expiresAt: expirationTime,
        subject: state.examInfo.subject,
        session: state.examInfo.sessionName,
        notes: notes || 'Pembaruan berkala pengawas',
      };

      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          currentToken: sanitized,
          tokenCreatedAt: creationTime,
          tokenExpiresAt: expirationTime,
          history: [historyItem, ...prev.history.slice(0, 49)], // keep last 50
        };
        broadcastState(newState);
        return newState;
      });

      if (state.settings.soundEnabled) {
        playTokenUpdateChime();
      }
    },
    [state.settings.tokenDurationMinutes, state.settings.soundEnabled, state.examInfo.subject, state.examInfo.sessionName, broadcastState]
  );

  const restoreToken = useCallback(
    (token: string, durationMinutes?: number) => {
      updateToken(token, durationMinutes, 'Menggunakan kembali token sebelumnya');
    },
    [updateToken]
  );

  const updateExamInfo = useCallback(
    (info: Partial<ExamInfo>) => {
      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          examInfo: {
            ...prev.examInfo,
            ...info,
          },
        };
        broadcastState(newState);
        return newState;
      });
    },
    [broadcastState]
  );

  const updateSettings = useCallback(
    (settings: Partial<ExamSettings>) => {
      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          settings: {
            ...prev.settings,
            ...settings,
          },
        };
        broadcastState(newState);
        return newState;
      });
    },
    [broadcastState]
  );

  const clearHistory = useCallback(() => {
    setState((prev) => {
      const newState: ExamState = {
        ...prev,
        history: [],
      };
      broadcastState(newState);
      return newState;
    });
  }, [broadcastState]);

  const resetToDefaults = useCallback(() => {
    const resetState = {
      ...defaultInitialState,
      currentToken: generateCbtToken(6),
      tokenCreatedAt: Date.now(),
      tokenExpiresAt: Date.now() + 15 * 60 * 1000,
    };
    setState(resetState);
    broadcastState(resetState);
  }, [broadcastState]);

  const remainingMs = useMemo(() => {
    if (!state.tokenExpiresAt) return 99999999;
    return Math.max(0, state.tokenExpiresAt - currentTime);
  }, [state.tokenExpiresAt, currentTime]);

  const isTokenExpired = useMemo(() => {
    if (!state.tokenExpiresAt) return false;
    return remainingMs <= 0;
  }, [state.tokenExpiresAt, remainingMs]);

  return (
    <ExamContext.Provider
      value={{
        state,
        updateToken,
        updateExamInfo,
        updateSettings,
        clearHistory,
        restoreToken,
        resetToDefaults,
        isTokenExpired,
        remainingMs,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
