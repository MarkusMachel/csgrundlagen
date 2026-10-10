import type { AnswerValue } from '@/features/questions/types';
import { api, ApiError } from '@/shared/api/client';

/**
 * Answers given while offline, waiting to be sent. Kept in IndexedDB so they
 * survive closing the app; in memory where IndexedDB is missing (tests).
 * Each answer remembers whose it is: on a shared device it is only ever
 * sent while that same user is signed in.
 */
export interface PendingAnswer {
  id?: number;
  userId: string;
  questionId: string;
  answer: AnswerValue;
  answeredAt: string;
}

const DB = 'cft-offline';
const STORE = 'answers';

let memory: PendingAnswer[] = [];
let nextMemoryId = 1;
const listeners = new Set<() => void>();
let cachedCount = 0;

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined';
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

async function all(): Promise<PendingAnswer[]> {
  if (!hasIndexedDB()) return [...memory];
  return tx('readonly', (s) => s.getAll() as IDBRequest<PendingAnswer[]>);
}

async function remove(id: number) {
  if (!hasIndexedDB()) {
    memory = memory.filter((a) => a.id !== id);
    return;
  }
  await tx('readwrite', (s) => s.delete(id));
}

async function refreshCount() {
  cachedCount = (await all()).length;
  listeners.forEach((l) => l());
}

export async function enqueueAnswer(item: Omit<PendingAnswer, 'id'>) {
  if (!hasIndexedDB()) memory.push({ ...item, id: nextMemoryId++ });
  else await tx('readwrite', (s) => s.add(item));
  await refreshCount();
}

/** For useSyncExternalStore: how many answers are waiting (all users on this device). */
export function subscribePending(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const pendingCount = () => cachedCount;
export const loadPendingCount = refreshCount;

let flushing: Promise<number> | null = null;

/**
 * Sends the signed-in user's waiting answers, oldest first, and returns how
 * many went through. Stops at the first network failure (still offline) or
 * sign-in problem; drops answers the server rejects for good (e.g. the
 * question was deleted).
 */
export function flushOutbox(userId: string): Promise<number> {
  flushing ??= (async () => {
    let sent = 0;
    try {
      const mine = (await all())
        .filter((a) => a.userId === userId)
        .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
      for (const item of mine) {
        try {
          await api.post(`/questions/${item.questionId}/submit`, {
            answer: item.answer,
            answeredAt: item.answeredAt,
          });
          await remove(item.id!);
          sent++;
        } catch (err) {
          if (
            err instanceof ApiError &&
            err.status >= 400 &&
            err.status < 500 &&
            err.status !== 401 &&
            err.status !== 429
          ) {
            await remove(item.id!); // permanently invalid
            continue;
          }
          break; // offline again, signed out, or rate limited: try later
        }
      }
    } finally {
      await refreshCount();
      flushing = null;
    }
    return sent;
  })();
  return flushing;
}

/** True for errors that mean "couldn't reach the server" rather than a server answer. */
export function isNetworkError(err: unknown) {
  return !(err instanceof ApiError) || err.status === 0;
}

/** Test helper. */
export function resetOutbox() {
  memory = [];
  nextMemoryId = 1;
  cachedCount = 0;
}
