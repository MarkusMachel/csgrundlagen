import { create } from 'zustand';

/**
 * In-progress test-builder selection (§11) — feature-scoped store, not global:
 * only the Build-a-Test flow reads it, so it lives inside this feature.
 */
interface TestBuilderState {
  selectedQuestionIds: string[];
  toggleQuestion: (id: string) => void;
  removeQuestion: (id: string) => void;
  clear: () => void;
}

export const useTestBuilderStore = create<TestBuilderState>()((set) => ({
  selectedQuestionIds: [],
  toggleQuestion: (id) =>
    set((s) => ({
      selectedQuestionIds: s.selectedQuestionIds.includes(id)
        ? s.selectedQuestionIds.filter((q) => q !== id)
        : [...s.selectedQuestionIds, id],
    })),
  removeQuestion: (id) =>
    set((s) => ({ selectedQuestionIds: s.selectedQuestionIds.filter((q) => q !== id) })),
  clear: () => set({ selectedQuestionIds: [] }),
}));
