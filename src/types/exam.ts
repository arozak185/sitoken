export interface TokenHistoryItem {
  id: string;
  token: string;
  createdAt: number;
  expiresAt: number | null; // null = no expiration
  subject: string;
  session: string;
  notes?: string;
}

export interface ExamInfo {
  examName: string; // e.g., "Asesmen Sumatif Akhir Semester (ASAS)"
  subject: string; // e.g., "Pemrograman Web & Perangkat Bergerak"
  gradeAndMajor: string; // e.g., "XII RPL (Rekayasa Perangkat Lunak)"
  roomName: string; // e.g., "Lab Komputer 01"
  sessionName: string; // e.g., "Sesi 1 (07.30 - 09.30 WIB)"
  proctor1: string; // e.g., "Drs. H. Ahmad Fauzi"
  proctor2: string; // e.g., "Siti Nurjanah, S.Pd."
  cbtUrl: string; // e.g., "https://cbt.smkassyafiiyah.sch.id"
  announcement: string; // e.g., "Kerjakan dengan jujur, teliti, dan mandiri. Awali dengan doa."
}

export type TokenDisplaySize = 'normal' | 'large' | 'jumbo';

export interface ExamSettings {
  adminPin: string;
  soundEnabled: boolean;
  tokenDurationMinutes: number; // 0 for no limit, 15, 30, 45, 60
  displaySize: TokenDisplaySize;
  highContrast: boolean;
  focusMode: boolean; // hide extra details, keep only token + clock
  iconType: 'graduation' | 'school' | 'book';
}

export interface ExamState {
  currentToken: string;
  tokenCreatedAt: number;
  tokenExpiresAt: number | null;
  examInfo: ExamInfo;
  history: TokenHistoryItem[];
  settings: ExamSettings;
}
