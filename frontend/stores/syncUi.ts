import { create } from 'zustand';

type SyncUiState = {
  isSyncing: boolean;
  setSyncing: (next: boolean) => void;
};

/**
 * UI-only: spinning plate + listeners while Watermelon sync runs (§4.4.5).
 */
export const useSyncUi = create<SyncUiState>((set) => ({
  isSyncing: false,
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
