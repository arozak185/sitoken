import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  doc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import { ExamInfo, ExamSettings, ExamState, TokenHistoryItem } from '../types/exam';
import { generateCbtToken, sanitizeToken } from '../utils/tokenGenerator';
import { playTokenUpdateChime } from '../utils/audio';

const STORAGE_KEY = 'smk_assyafi_exam_token_state_v2_tka';
const BROADCAST_CHANNEL_NAME = 'smk_cbt_token_sync_channel';

const defaultExamInfo: ExamInfo = {
  examName: 'Tes Kemampuan Akademik (TKA)',
  subject: 'Tes Kemampuan Akademik (TKA)',
  gradeAndMajor: 'Semua Jurusan — SMK As-Syafi\'iyah',
  roomName: 'Seluruh Ruang Ujian / Lab CBT',
  sessionName: 'Sesi 1 (07.30 - 09.30 WIB)',
  proctor1: 'Pengawas Ruang TKA',
  proctor2: 'Proktor CBT',
  cbtUrl: 'https://cbt.smkassyafiiyah.sch.id',
  announcement:
    'Kegiatan Tes Kemampuan Akademik (TKA). Kerjakan soal dengan mandiri, jujur, dan teliti.',
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
      notes: 'Token Ujian Awal TKA',
    },
  ],
  settings: defaultSettings,
};

interface ExamContextType {
  state: ExamState;
  updateToken: (newToken: string, durationMinutes?: number, notes?: string) => Promise<void>;
  updateExamInfo: (info: Partial<ExamInfo>) => Promise<void>;
  updateSettings: (settings: Partial<ExamSettings>) => Promise<void>;
  clearHistory: () => Promise<void>;
  restoreToken: (token: string, durationMinutes?: number) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isTokenExpired: boolean;
  remainingMs: number;
  cloudStatus: 'connected' | 'connecting' | 'offline';
  currentUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const prevTokenRef = useRef(state.currentToken);
  const isFirstLoadRef = useRef(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  // Mandatory Connection Validation
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
          setCloudStatus('offline');
        }
      }
    }
    testConnection();
  }, []);

  // Real-time Firestore sync listener for active session across all exam rooms
  useEffect(() => {
    const activeDocRef = doc(db, 'exam_state', 'active_session');

    const unsubscribe = onSnapshot(
      activeDocRef,
      (snapshot) => {
        setCloudStatus('connected');
        if (snapshot.exists()) {
          const data = snapshot.data();

          setState((prev) => {
            const nextState: ExamState = {
              ...prev,
              currentToken: data.currentToken || prev.currentToken,
              tokenCreatedAt: data.tokenCreatedAt || prev.tokenCreatedAt,
              tokenExpiresAt: data.tokenExpiresAt ?? prev.tokenExpiresAt,
              examInfo: {
                ...prev.examInfo,
                examName: data.examName || prev.examInfo.examName,
                subject: data.subject || prev.examInfo.subject,
                gradeAndMajor: data.gradeAndMajor || prev.examInfo.gradeAndMajor,
                roomName: data.roomName || prev.examInfo.roomName,
                sessionName: data.sessionName || prev.examInfo.sessionName,
                proctor1: data.proctor1 || prev.examInfo.proctor1,
                proctor2: data.proctor2 || prev.examInfo.proctor2,
                cbtUrl: data.cbtUrl || prev.examInfo.cbtUrl,
                announcement: data.announcement || prev.examInfo.announcement,
              },
              settings: {
                ...prev.settings,
                soundEnabled: data.soundEnabled !== undefined ? data.soundEnabled : prev.settings.soundEnabled,
                tokenDurationMinutes:
                  data.tokenDurationMinutes !== undefined ? data.tokenDurationMinutes : prev.settings.tokenDurationMinutes,
                displaySize: data.displaySize || prev.settings.displaySize,
                iconType: data.iconType || prev.settings.iconType,
              },
            };

            // Play notification chime when token changes in another room/admin
            if (!isFirstLoadRef.current && prevTokenRef.current !== nextState.currentToken) {
              if (nextState.settings.soundEnabled) {
                playTokenUpdateChime();
              }
            }

            prevTokenRef.current = nextState.currentToken;
            isFirstLoadRef.current = false;
            broadcastState(nextState);
            return nextState;
          });
        } else {
          // Document does not exist yet on cloud, seed with current state
          const payload = {
            currentToken: state.currentToken,
            tokenCreatedAt: state.tokenCreatedAt,
            tokenExpiresAt: state.tokenExpiresAt,
            examName: state.examInfo.examName,
            subject: state.examInfo.subject,
            gradeAndMajor: state.examInfo.gradeAndMajor,
            roomName: state.examInfo.roomName,
            sessionName: state.examInfo.sessionName,
            proctor1: state.examInfo.proctor1,
            proctor2: state.examInfo.proctor2,
            cbtUrl: state.examInfo.cbtUrl,
            announcement: state.examInfo.announcement,
            soundEnabled: state.settings.soundEnabled,
            tokenDurationMinutes: state.settings.tokenDurationMinutes,
            displaySize: state.settings.displaySize,
            iconType: state.settings.iconType,
            updatedAt: Date.now(),
          };
          setDoc(activeDocRef, payload).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, 'exam_state/active_session');
          });
        }
      },
      (error) => {
        setCloudStatus('offline');
        handleFirestoreError(error, OperationType.GET, 'exam_state/active_session');
      }
    );

    return () => unsubscribe();
  }, [broadcastState]);

  // Real-time Firestore sync listener for token history
  useEffect(() => {
    const historyCol = collection(db, 'token_history');
    const historyQuery = query(historyCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: TokenHistoryItem[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            items.push({
              id: docSnap.id,
              token: d.token,
              createdAt: d.createdAt,
              expiresAt: d.expiresAt ?? null,
              subject: d.subject || 'Tes Kemampuan Akademik (TKA)',
              session: d.session || '',
              notes: d.notes || '',
            });
          });
          setState((prev) => ({
            ...prev,
            history: items,
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'token_history');
      }
    );

    return () => unsubscribe();
  }, []);

  // Update token function - saves to Firestore and broadcasts to ALL rooms
  const updateToken = useCallback(
    async (newTokenInput: string, durationMinutes?: number, notes?: string) => {
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
        notes: notes || 'Pembaruan berkala pengawas pusat',
      };

      // 1. Optimistic Local State Update
      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          currentToken: sanitized,
          tokenCreatedAt: creationTime,
          tokenExpiresAt: expirationTime,
          history: [historyItem, ...prev.history.slice(0, 49)],
        };
        broadcastState(newState);
        return newState;
      });

      if (state.settings.soundEnabled) {
        playTokenUpdateChime();
      }

      // 2. Persist to Firestore for ALL Rooms
      const activeDocRef = doc(db, 'exam_state', 'active_session');
      const payload = {
        currentToken: sanitized,
        tokenCreatedAt: creationTime,
        tokenExpiresAt: expirationTime,
        examName: state.examInfo.examName,
        subject: state.examInfo.subject,
        gradeAndMajor: state.examInfo.gradeAndMajor,
        roomName: state.examInfo.roomName,
        sessionName: state.examInfo.sessionName,
        proctor1: state.examInfo.proctor1,
        proctor2: state.examInfo.proctor2,
        cbtUrl: state.examInfo.cbtUrl,
        announcement: state.examInfo.announcement,
        soundEnabled: state.settings.soundEnabled,
        tokenDurationMinutes: duration,
        displaySize: state.settings.displaySize,
        iconType: state.settings.iconType,
        updatedAt: creationTime,
      };

      try {
        await setDoc(activeDocRef, payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'exam_state/active_session');
      }

      // Save History record
      try {
        await setDoc(doc(db, 'token_history', historyItem.id), {
          token: historyItem.token,
          createdAt: historyItem.createdAt,
          expiresAt: historyItem.expiresAt,
          subject: historyItem.subject,
          session: historyItem.session,
          notes: historyItem.notes || '',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `token_history/${historyItem.id}`);
      }
    },
    [state.settings, state.examInfo, broadcastState]
  );

  const restoreToken = useCallback(
    async (token: string, durationMinutes?: number) => {
      await updateToken(token, durationMinutes, 'Menggunakan kembali token sebelumnya');
    },
    [updateToken]
  );

  const updateExamInfo = useCallback(
    async (info: Partial<ExamInfo>) => {
      const updatedExamInfo = { ...state.examInfo, ...info };

      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          examInfo: updatedExamInfo,
        };
        broadcastState(newState);
        return newState;
      });

      try {
        await setDoc(
          doc(db, 'exam_state', 'active_session'),
          {
            examName: updatedExamInfo.examName,
            subject: updatedExamInfo.subject,
            gradeAndMajor: updatedExamInfo.gradeAndMajor,
            roomName: updatedExamInfo.roomName,
            sessionName: updatedExamInfo.sessionName,
            proctor1: updatedExamInfo.proctor1,
            proctor2: updatedExamInfo.proctor2,
            cbtUrl: updatedExamInfo.cbtUrl,
            announcement: updatedExamInfo.announcement,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'exam_state/active_session');
      }
    },
    [state.examInfo, broadcastState]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<ExamSettings>) => {
      const mergedSettings = { ...state.settings, ...newSettings };

      setState((prev) => {
        const newState: ExamState = {
          ...prev,
          settings: mergedSettings,
        };
        broadcastState(newState);
        return newState;
      });

      try {
        await setDoc(
          doc(db, 'exam_state', 'active_session'),
          {
            soundEnabled: mergedSettings.soundEnabled,
            tokenDurationMinutes: mergedSettings.tokenDurationMinutes,
            displaySize: mergedSettings.displaySize,
            iconType: mergedSettings.iconType,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'exam_state/active_session');
      }
    },
    [state.settings, broadcastState]
  );

  const clearHistory = useCallback(async () => {
    setState((prev) => {
      const newState: ExamState = {
        ...prev,
        history: [],
      };
      broadcastState(newState);
      return newState;
    });
  }, [broadcastState]);

  const resetToDefaults = useCallback(async () => {
    const newToken = generateCbtToken(6);
    const resetTime = Date.now();
    const resetState = {
      ...defaultInitialState,
      currentToken: newToken,
      tokenCreatedAt: resetTime,
      tokenExpiresAt: resetTime + 15 * 60 * 1000,
    };

    setState(resetState);
    broadcastState(resetState);

    try {
      await setDoc(doc(db, 'exam_state', 'active_session'), {
        currentToken: newToken,
        tokenCreatedAt: resetTime,
        tokenExpiresAt: resetTime + 15 * 60 * 1000,
        examName: defaultExamInfo.examName,
        subject: defaultExamInfo.subject,
        gradeAndMajor: defaultExamInfo.gradeAndMajor,
        roomName: defaultExamInfo.roomName,
        sessionName: defaultExamInfo.sessionName,
        proctor1: defaultExamInfo.proctor1,
        proctor2: defaultExamInfo.proctor2,
        cbtUrl: defaultExamInfo.cbtUrl,
        announcement: defaultExamInfo.announcement,
        soundEnabled: defaultSettings.soundEnabled,
        tokenDurationMinutes: defaultSettings.tokenDurationMinutes,
        displaySize: defaultSettings.displaySize,
        iconType: defaultSettings.iconType,
        updatedAt: resetTime,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'exam_state/active_session');
    }
  }, [broadcastState]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Login Error:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

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
        cloudStatus,
        currentUser,
        loginWithGoogle,
        logout,
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
