import { describe, expect, it, beforeEach } from 'vitest';

import { useTestBuilderStore } from '@/features/custom-tests';

import { useUIStore } from '../useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      themeMode: 'light',
      locale: 'en',
      streak: 0,
      statusText: null,
      statusDots: null,
    });
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

  it('increments the streak on correct answers and resets on a wrong one', () => {
    const s = useUIStore.getState();
    s.recordAnswerResult(true);
    s.recordAnswerResult(true);
    expect(useUIStore.getState().streak).toBe(2);
    useUIStore.getState().recordAnswerResult(false);
    expect(useUIStore.getState().streak).toBe(0);
  });

  it('does not persist session-only state (streak, status)', () => {
    useUIStore.getState().recordAnswerResult(true);
    useUIStore.getState().setStatus('question 1 of 5', [true, false]);
    const persisted = JSON.parse(localStorage.getItem('cft.ui') ?? '{}') as {
      state?: Record<string, unknown>;
    };
    expect(persisted.state).not.toHaveProperty('streak');
    expect(persisted.state).not.toHaveProperty('statusText');
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
