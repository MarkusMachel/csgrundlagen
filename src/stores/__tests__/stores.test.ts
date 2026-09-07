import { describe, expect, it, beforeEach } from 'vitest';

import { useTestBuilderStore } from '@/features/custom-tests';

import { useUIStore } from '../useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      themeMode: 'light',
      locale: 'en',
      sidebarCollapsed: false,
      mobileDrawerOpen: false,
    });
  });

  it('toggles the sidebar collapsed state', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggles theme mode and persists it to localStorage', () => {
    useUIStore.getState().toggleThemeMode();
    expect(useUIStore.getState().themeMode).toBe('dark');
    const persisted = JSON.parse(localStorage.getItem('cft.ui') ?? '{}') as {
      state?: { themeMode?: string };
    };
    expect(persisted.state?.themeMode).toBe('dark');
  });

  it('persists locale changes', () => {
    useUIStore.getState().setLocale('pt-BR');
    expect(useUIStore.getState().locale).toBe('pt-BR');
    const persisted = JSON.parse(localStorage.getItem('cft.ui') ?? '{}') as {
      state?: { locale?: string };
    };
    expect(persisted.state?.locale).toBe('pt-BR');
  });
});

describe('useTestBuilderStore', () => {
  beforeEach(() => useTestBuilderStore.setState({ selectedQuestionIds: [] }));

  it('toggles questions in and out of the selection, preserving order', () => {
    const s = useTestBuilderStore.getState();
    s.toggleQuestion('q1');
    s.toggleQuestion('q2');
    s.toggleQuestion('q3');
    expect(useTestBuilderStore.getState().selectedQuestionIds).toEqual(['q1', 'q2', 'q3']);
    useTestBuilderStore.getState().toggleQuestion('q2');
    expect(useTestBuilderStore.getState().selectedQuestionIds).toEqual(['q1', 'q3']);
  });

  it('clears the selection', () => {
    useTestBuilderStore.getState().toggleQuestion('q1');
    useTestBuilderStore.getState().clear();
    expect(useTestBuilderStore.getState().selectedQuestionIds).toEqual([]);
  });
});
