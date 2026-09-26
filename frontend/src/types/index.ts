export type ScriptType = 'QUOC_NGU' | 'HAN' | 'PALI';
export type GridType = 'GRID_OLY' | 'GRID_HAN' | 'LINE' | 'BLANK';
export type PaperType = 'DO' | 'OLD_GOLD' | 'WHITE';
export type BrushType = 'CALLIGRAPHY' | 'PEN' | 'PENCIL';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  time?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  brushType: BrushType;
}

export interface SutraSummary {
  id: number;
  title: string;
  description?: string;
  scriptType: ScriptType;
  originalSource?: string;
  totalWords: number;
  totalPages: number;
  isPublished: boolean;
  createdAt: string;
}

export interface SutraPage {
  id: number;
  sutraId: number;
  pageNumber: number;
  contentText: string;
  totalWordsOnPage: number;
  lineCount: number;
  defaultFontSize: number;
  defaultGridType: GridType;
}

export interface SutraDetail extends SutraSummary {
  pages: SutraPage[];
}

export interface UserAttempt {
  id: number;
  sutraId: number;
  sutraTitle: string;
  attemptNumber: number;
  completedWords: number;
  totalWords: number;
  progressPercent: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  completedChunksJson?: string;
  currentChunkIndex?: number;
  currentPageNumber?: number;
  totalNotebookPages?: number;
  startedAt: string;
  completedAt?: string;
}

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  userType: 'User' | 'Admin';
  roles: string[];
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface SutraReport {
  sutraId: number;
  title: string;
  scriptType: ScriptType;
  totalWords: number;
  totalPages: number;
  participantCount: number;
  totalAttempts: number;
  completedAttempts: number;
  avgProgressPercent: number;
}

export interface RecentActivity {
  attemptId: number;
  userName: string;
  userAvatar?: string;
  sutraTitle: string;
  progressPercent: number;
  status: string;
  startedAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalParticipants: number;
  totalAttempts: number;
  totalCompletedAttempts: number;
  totalPagesWritten: number;
  totalWordsWritten: number;
  sutraStats: SutraReport[];
  recentActivities: RecentActivity[];
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  totalSutrasJoined: number;
  totalSutrasCompleted: number;
  totalPagesWritten: number;
  totalWordsWritten: number;
}

export interface MySutraAttempt {
  attemptId: number;
  sutraId: number;
  title: string;
  description?: string;
  scriptType: ScriptType;
  totalWords: number;
  totalPages: number;
  attemptNumber: number;
  completedWords: number;
  progressPercent: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  currentPageNumber: number;
  startedAt: string;
  completedAt?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  userType: string;
  isActive: boolean;
  isGoogleAccount: boolean;
  createdAt: string;
  totalSutrasJoined: number;
  totalWordsWritten: number;
}


