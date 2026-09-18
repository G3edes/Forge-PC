'use client';

/**
 * The single source of truth for the build being edited.
 *
 * Only component ids are persisted (see `partialize`/`merge`), which keeps the
 * stored payload tiny and lets the catalog evolve without invalidating data.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EMPTY_BUILD, idsToSelection, selectionToIds } from '@/lib/build-utils';
import { calculateTotal } from '@/lib/calculations';
import { DEFAULT_RGB } from '@/lib/share';
import type {
  BuildComponentIds,
  BuildSelection,
  FanSelection,
  RgbEffect,
  RgbSettings,
} from '@/types/build';
import type { ComponentCategory, PCComponent } from '@/types/components';

export interface BuildState {
  /** Name shown in the summary and used when saving/exporting. */
  name: string;
  /** Id of the saved build currently open, when the user loaded one. */
  currentBuildId: string | null;
  build: BuildSelection;
  rgb: RgbSettings;
  /** Set once the persisted state has been read, so the UI can avoid flicker. */
  hydrated: boolean;

  setName: (name: string) => void;
  /** Adds or replaces the component occupying its category. */
  addComponent: (component: PCComponent) => void;
  removeComponent: (category: ComponentCategory, componentId?: string) => void;
  setFanQuantity: (componentId: string, quantity: number) => void;
  clearBuild: () => void;
  loadBuild: (input: {
    id?: string | null;
    name?: string;
    componentIds: BuildComponentIds;
    rgb?: RgbSettings;
  }) => void;
  setRgb: (patch: Partial<RgbSettings>) => void;
  setRgbEffect: (effect: RgbEffect) => void;
  calculateTotal: () => number;
  getComponentIds: () => BuildComponentIds;
}

interface PersistedBuildState {
  name: string;
  currentBuildId: string | null;
  componentIds: BuildComponentIds;
  rgb: RgbSettings;
}

function isPersisted(value: unknown): value is PersistedBuildState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'componentIds' in value &&
    typeof (value as PersistedBuildState).componentIds === 'object'
  );
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      name: 'Nova build',
      currentBuildId: null,
      build: { ...EMPTY_BUILD, fans: [] },
      rgb: { ...DEFAULT_RGB },
      hydrated: false,

      setName: (name) => set({ name }),

      addComponent: (component) =>
        set((state) => {
          if (component.category === 'fans') {
            const existing = state.build.fans.find(
              (fan) => fan.component.id === component.id,
            );
            const fans: FanSelection[] = existing
              ? state.build.fans.map((fan) =>
                  fan.component.id === component.id
                    ? { ...fan, quantity: fan.quantity + 1 }
                    : fan,
                )
              : [...state.build.fans, { component, quantity: 1 }];
            return { build: { ...state.build, fans } };
          }

          // Every other category holds exactly one part, so adding replaces.
          return {
            build: { ...state.build, [component.category]: component } as BuildSelection,
          };
        }),

      removeComponent: (category, componentId) =>
        set((state) => {
          if (category === 'fans') {
            const fans = componentId
              ? state.build.fans.filter((fan) => fan.component.id !== componentId)
              : [];
            return { build: { ...state.build, fans } };
          }
          return { build: { ...state.build, [category]: null } as BuildSelection };
        }),

      setFanQuantity: (componentId, quantity) =>
        set((state) => {
          const safeQuantity = Math.max(0, Math.trunc(quantity));
          const fans =
            safeQuantity === 0
              ? state.build.fans.filter((fan) => fan.component.id !== componentId)
              : state.build.fans.map((fan) =>
                  fan.component.id === componentId
                    ? { ...fan, quantity: Math.min(safeQuantity, 12) }
                    : fan,
                );
          return { build: { ...state.build, fans } };
        }),

      clearBuild: () =>
        set({
          build: { ...EMPTY_BUILD, fans: [] },
          name: 'Nova build',
          currentBuildId: null,
        }),

      loadBuild: ({ id, name, componentIds, rgb }) =>
        set((state) => ({
          build: idsToSelection(componentIds),
          name: name ?? state.name,
          currentBuildId: id ?? null,
          rgb: rgb ?? state.rgb,
        })),

      setRgb: (patch) => set((state) => ({ rgb: { ...state.rgb, ...patch } })),

      setRgbEffect: (effect) => set((state) => ({ rgb: { ...state.rgb, effect } })),

      calculateTotal: () => calculateTotal(get().build),

      getComponentIds: () => selectionToIds(get().build),
    }),
    {
      name: 'build-forge:current-build:v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) =>
        ({
          name: state.name,
          currentBuildId: state.currentBuildId,
          componentIds: selectionToIds(state.build),
          rgb: state.rgb,
        }) as unknown as BuildState,
      merge: (persisted, current) => {
        if (!isPersisted(persisted)) return current;
        return {
          ...current,
          name: persisted.name ?? current.name,
          currentBuildId: persisted.currentBuildId ?? null,
          build: idsToSelection(persisted.componentIds),
          rgb: { ...current.rgb, ...(persisted.rgb ?? {}) },
        };
      },
    },
  ),
);

/**
 * `onRehydrateStorage` fires while `create()` is still running, when the store
 * binding does not exist yet — so the flag is wired up here instead. With
 * `localStorage` hydration resolves synchronously, hence the `hasHydrated()`
 * check as well as the listener.
 */
if (typeof window !== 'undefined') {
  useBuildStore.persist.onFinishHydration(() => {
    useBuildStore.setState({ hydrated: true });
  });
  if (useBuildStore.persist.hasHydrated()) {
    useBuildStore.setState({ hydrated: true });
  }
}
