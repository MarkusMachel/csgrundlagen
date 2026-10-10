import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LEGACY_TOKEN_KEY } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

import { useSessionBootstrap } from '..';

describe('session cookie', () => {
  it('restores a session from the cookie', async () => {
    document.cookie = 'cft_session=mock-token.u2; path=/';
    useAuthStore.setState({ user: null, status: 'unknown' });
    renderHook(() => useSessionBootstrap());
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(useAuthStore.getState().user?.id).toBe('u2');
  });

  it('is anonymous without a cookie', async () => {
    useAuthStore.setState({ user: null, status: 'unknown' });
    renderHook(() => useSessionBootstrap());
    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
  });

  it('moves a token left in localStorage into the cookie and forgets it', async () => {
    localStorage.setItem(LEGACY_TOKEN_KEY, 'mock-token.u1');
    useAuthStore.setState({ user: null, status: 'unknown' });
    renderHook(() => useSessionBootstrap());
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(document.cookie).toContain('cft_session=mock-token.u1');
  });
});
