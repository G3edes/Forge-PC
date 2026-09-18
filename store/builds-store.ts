'use client';

/**
 * Saved-builds collection.
 *
 * The store is a thin cache over `BuildRepository`; swapping the repository for
 * an API client is the only change needed to move this to a database.
 */

import { create } from 'zustand';

import { localBuildRepository, type BuildRepository } from '@/lib/storage';
import type { BuildComponentIds, RgbSettings, SavedBuild } from '@/types/build';

export interface BuildsState {
  builds: SavedBuild[];
  loaded: boolean;
  repository: BuildRepository;

  refresh: () => void;
  save: (input: {
    id?: string | null;
    name: string;
    description?: string;
    componentIds: BuildComponentIds;
    rgb: RgbSettings;
  }) => SavedBuild;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => SavedBuild | null;
  remove: (id: string) => void;
  getById: (id: string) => SavedBuild | null;
}

export const useBuildsStore = create<BuildsState>()((set, get) => ({
  builds: [],
  loaded: false,
  repository: localBuildRepository,

  refresh: () => set({ builds: get().repository.list(), loaded: true }),

  save: ({ id, name, description, componentIds, rgb }) => {
    const repository = get().repository;
    const existing = id ? repository.get(id) : null;

    const saved = existing
      ? (repository.update(existing.id, { name, description, componentIds, rgb }) ?? existing)
      : repository.create({ name, description, componentIds, rgb });

    set({ builds: repository.list(), loaded: true });
    return saved;
  },

  rename: (id, name) => {
    const repository = get().repository;
    repository.update(id, { name });
    set({ builds: repository.list() });
  },

  duplicate: (id) => {
    const repository = get().repository;
    const copy = repository.duplicate(id);
    set({ builds: repository.list() });
    return copy;
  },

  remove: (id) => {
    const repository = get().repository;
    repository.remove(id);
    set({ builds: repository.list() });
  },

  getById: (id) => get().repository.get(id),
}));
