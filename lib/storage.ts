/**
 * Persistence layer.
 *
 * Today everything lives in `localStorage`. The `BuildRepository` interface is
 * the seam a future backend plugs into: swap `localBuildRepository` for an HTTP
 * implementation and no caller needs to change.
 *
 * Every access is wrapped in try/catch because `localStorage` throws in private
 * browsing modes and is simply absent during server rendering.
 */

import type { BuildComponentIds, RgbSettings, SavedBuild } from '@/types/build';

const STORAGE_KEY = 'build-forge:builds:v1';

export interface BuildRepository {
  list(): SavedBuild[];
  get(id: string): SavedBuild | null;
  save(build: SavedBuild): SavedBuild;
  create(input: {
    name: string;
    description?: string;
    componentIds: BuildComponentIds;
    rgb: RgbSettings;
  }): SavedBuild;
  update(id: string, patch: Partial<Omit<SavedBuild, 'id' | 'createdAt'>>): SavedBuild | null;
  duplicate(id: string): SavedBuild | null;
  remove(id: string): boolean;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): SavedBuild[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedBuild);
  } catch (error) {
    console.warn('[build-forge] não foi possível ler as builds salvas', error);
    return [];
  }
}

function writeAll(builds: SavedBuild[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (error) {
    console.warn('[build-forge] não foi possível gravar as builds salvas', error);
  }
}

/** Runtime guard — stored data may come from an older version of the app. */
function isSavedBuild(value: unknown): value is SavedBuild {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<SavedBuild>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.componentIds === 'object' &&
    candidate.componentIds !== null
  );
}

export function createId(prefix = 'build'): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export const localBuildRepository: BuildRepository = {
  list() {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  get(id) {
    return readAll().find((build) => build.id === id) ?? null;
  },

  save(build) {
    const all = readAll();
    const index = all.findIndex((item) => item.id === build.id);
    const next = { ...build, updatedAt: new Date().toISOString() };
    if (index >= 0) all[index] = next;
    else all.push(next);
    writeAll(all);
    return next;
  },

  create(input) {
    const now = new Date().toISOString();
    const build: SavedBuild = {
      id: createId(),
      name: input.name,
      description: input.description,
      componentIds: input.componentIds,
      rgb: input.rgb,
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    all.push(build);
    writeAll(all);
    return build;
  },

  update(id, patch) {
    const all = readAll();
    const index = all.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const next: SavedBuild = {
      ...all[index],
      ...patch,
      id: all[index].id,
      createdAt: all[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    all[index] = next;
    writeAll(all);
    return next;
  },

  duplicate(id) {
    const source = this.get(id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: SavedBuild = {
      ...source,
      id: createId(),
      name: `${source.name} (cópia)`,
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    all.push(copy);
    writeAll(all);
    return copy;
  },

  remove(id) {
    const all = readAll();
    const next = all.filter((build) => build.id !== id);
    if (next.length === all.length) return false;
    writeAll(next);
    return true;
  },
};

/** Small helper for per-key JSON preferences (viewer settings, last build, ...). */
export function readPreference<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writePreference<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[build-forge] não foi possível gravar a preferência "${key}"`, error);
  }
}
