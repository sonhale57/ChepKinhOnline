import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Stroke } from '../types';

export interface AttemptProgressData {
  userId?: number;
  attemptId: number;
  sutraId: number;
  completedChunks: Record<number, boolean>;
  currentChunkIndex: number;
  currentPageIndex: number;
  totalNotebookPages: number;
  matchPercent: number;
  matchedChunksCount: number;
  totalChunksCount: number;
  updatedAt: number;
}

interface ChepKinhDB extends DBSchema {
  pageStrokes: {
    key: string;
    value: {
      userId?: number;
      attemptId: number;
      pageId: number;
      strokes: Stroke[];
      isCompleted: boolean;
      updatedAt: number;
    };
  };
  attemptProgress: {
    key: string;
    value: AttemptProgressData;
  };
}

const DB_NAME = 'ChepKinhDigitalInkDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ChepKinhDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ChepKinhDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChepKinhDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<ChepKinhDB>) {
        if (!db.objectStoreNames.contains('pageStrokes')) {
          db.createObjectStore('pageStrokes');
        }
        if (!db.objectStoreNames.contains('attemptProgress')) {
          db.createObjectStore('attemptProgress');
        }
      },
    });
  }
  return dbPromise;
}

export const inkStorage = {
  async savePageStrokes(
    attemptId: number,
    pageId: number,
    strokes: Stroke[],
    isCompleted: boolean = false,
    userId: number = 0
  ): Promise<void> {
    const db = await getDB();
    const key = `strokes_u${userId}_att${attemptId}_p${pageId}`;
    await db.put('pageStrokes', {
      userId,
      attemptId,
      pageId,
      strokes,
      isCompleted,
      updatedAt: Date.now(),
    }, key);
  },

  async getPageStrokes(
    attemptId: number,
    pageId: number,
    userId: number = 0
  ): Promise<{ strokes: Stroke[]; isCompleted: boolean } | null> {
    const db = await getDB();
    const key = `strokes_u${userId}_att${attemptId}_p${pageId}`;
    let data = await db.get('pageStrokes', key);
    
    // Fallback cho key cũ nếu có
    if (!data) {
      const fallbackKey = `${attemptId}_${pageId}`;
      data = await db.get('pageStrokes', fallbackKey);
    }

    if (!data) return null;
    return {
      strokes: data.strokes,
      isCompleted: data.isCompleted,
    };
  },

  async clearPageStrokes(attemptId: number, pageId: number, userId: number = 0): Promise<void> {
    const db = await getDB();
    const key = `strokes_u${userId}_att${attemptId}_p${pageId}`;
    await db.delete('pageStrokes', key);
  },

  async saveAttemptProgress(progress: AttemptProgressData): Promise<void> {
    const db = await getDB();
    const uId = progress.userId || 0;
    const key = `progress_u${uId}_s${progress.sutraId}_att${progress.attemptId}`;
    await db.put('attemptProgress', {
      ...progress,
      updatedAt: Date.now(),
    }, key);
  },

  async getAttemptProgress(
    sutraId: number,
    attemptId: number,
    userId: number = 0
  ): Promise<AttemptProgressData | null> {
    const db = await getDB();
    const key = `progress_u${userId}_s${sutraId}_att${attemptId}`;
    let data = await db.get('attemptProgress', key);

    // Fallback cho key cũ nếu có
    if (!data) {
      const fallbackKey = `progress_${sutraId}_${attemptId}`;
      data = await db.get('attemptProgress', fallbackKey);
    }

    return data || null;
  }
};
