import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatSeconds, useCountdown } from '../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('counts down second by second', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(5, onExpire));
    expect(result.current).toBe(5);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(3);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('fires onExpire exactly once at zero and stops at 0', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(3, onExpire));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('cleans up its interval on unmount', () => {
    const onExpire = vi.fn();
    const { unmount } = renderHook(() => useCountdown(3, onExpire));
    unmount();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onExpire).not.toHaveBeenCalled();
  });
});

describe('formatSeconds', () => {
  it('formats minutes:seconds with zero padding', () => {
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(65)).toBe('1:05');
    expect(formatSeconds(600)).toBe('10:00');
  });
});
