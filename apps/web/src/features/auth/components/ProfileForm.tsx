import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LOCALES } from '@/i18n/config';
import type { Locale } from '@/shared/types';
import { Select } from '@/shared/ui';
import { useAuthStore } from '@/stores/useAuthStore';

import { authErrorMessage } from './formErrors';
import { useUpdateProfile } from '../hooks/useAuth';

/** Name and language, saved to the account. */
export function ProfileForm() {
  const { t } = useTranslation();
  const ids = { name: useId(), locale: useId() };
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'en');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLocale(user.locale);
    }
  }, [user]);

  const dirty = !!user && (name.trim() !== user.name || locale !== user.locale);
  const nameInvalid = name.trim().length === 0 || name.trim().length > 100;

  return (
    <form
      className="stack"
      style={{ gap: 14, maxWidth: 420 }}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!nameInvalid) update.mutate({ name: name.trim(), locale });
      }}
    >
      {update.isSuccess && !dirty && (
        <div className="alert alert--success" role="status">
          {t('account.profile.saved')}
        </div>
      )}
      {update.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(update.error, t)}
        </div>
      )}
      <div className={nameInvalid ? 'field field--error' : 'field'}>
        <label htmlFor={ids.name}>{t('auth.name')}</label>
        <input
          id={ids.name}
          className="input"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {nameInvalid && <span className="field-error-text">{t('auth.nameRequired')}</span>}
      </div>
      <div className="field">
        <label id={ids.locale}>{t('common.language')}</label>
        <Select
          labelledBy={ids.locale}
          value={locale}
          onChange={setLocale}
          options={SUPPORTED_LOCALES.map(({ code, label }) => ({ value: code, label }))}
        />
      </div>
      <div>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!dirty || nameInvalid || update.isPending}
        >
          {t('account.profile.save')}
        </button>
      </div>
    </form>
  );
}
