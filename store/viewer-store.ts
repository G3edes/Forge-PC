'use client';

/** Presentation-only state for the 3D viewer. Never persisted. */

import { create } from 'zustand';

import type { ComponentCategory } from '@/types/components';

export type ViewerSelection = ComponentCategory | 'case' | null;

export interface ViewerState {
  /** Makes the chassis translucent so the internals are visible. */
  xray: boolean;
  /** Pushes each group away from the chassis. */
  exploded: boolean;
  /** Side panel removed (open) vs. mounted (closed). */
  panelOpen: boolean;
  /** Draws the simplified power cables. */
  showCables: boolean;
  autoRotate: boolean;
  selected: ViewerSelection;
  hidden: ComponentCategory[];
  /** Incremented to ask the camera to return to its default framing. */
  cameraResetToken: number;

  toggleXray: () => void;
  toggleExploded: () => void;
  togglePanel: () => void;
  toggleCables: () => void;
  toggleAutoRotate: () => void;
  select: (selection: ViewerSelection) => void;
  toggleHidden: (category: ComponentCategory) => void;
  showAll: () => void;
  resetCamera: () => void;
}

export const useViewerStore = create<ViewerState>()((set) => ({
  xray: false,
  exploded: false,
  panelOpen: true,
  showCables: false,
  autoRotate: false,
  selected: null,
  hidden: [],
  cameraResetToken: 0,

  toggleXray: () => set((state) => ({ xray: !state.xray })),
  toggleExploded: () => set((state) => ({ exploded: !state.exploded })),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  toggleCables: () => set((state) => ({ showCables: !state.showCables })),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),

  select: (selection) =>
    set((state) => ({ selected: state.selected === selection ? null : selection })),

  toggleHidden: (category) =>
    set((state) => ({
      hidden: state.hidden.includes(category)
        ? state.hidden.filter((item) => item !== category)
        : [...state.hidden, category],
      selected: state.selected === category ? null : state.selected,
    })),

  showAll: () => set({ hidden: [] }),

  resetCamera: () => set((state) => ({ cameraResetToken: state.cameraResetToken + 1 })),
}));
