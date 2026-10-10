import type { TFunction } from 'i18next';

import { ApiError } from '@/shared/api/client';

/** A message for a failed auth request: friendly text for known cases, else the server's. */
export function authErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return t('auth.emailTaken');
    if (err.status === 429) return t('auth.tooManyAttempts');
    if (err.status === 400 && err.message) return err.message;
  }
  return t('auth.genericError');
}
