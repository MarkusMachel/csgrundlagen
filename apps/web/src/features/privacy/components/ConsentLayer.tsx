import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Modal } from '@/shared/ui';
import { useUIStore } from '@/stores/useUIStore';

import { ALL, ESSENTIAL_ONLY, useConsentStore, type ConsentChoice } from '../consent';

/**
 * The first-visit banner and the "privacy settings" dialog. "Accept all" and
 * "Essential only" are equally prominent, as the GDPR guidance asks: saying
 * no must be as easy as saying yes.
 */
export function ConsentLayer() {
  const { t } = useTranslation();
  const choice = useConsentStore((s) => s.choice);
  const settingsOpen = useConsentStore((s) => s.settingsOpen);
  const decide = useConsentStore((s) => s.decide);
  const openSettings = useConsentStore((s) => s.openSettings);

  const apply = (next: ConsentChoice) => {
    decide(next);
    // write the current theme and language now that they may be remembered
    if (next.preferences) useUIStore.setState((s) => ({ ...s }));
  };

  return (
    <>
      {!choice && !settingsOpen && (
        <section className="consent-banner" aria-label={t('privacy.banner.label')}>
          <Cookie size={20} aria-hidden className="consent-banner__icon" />
          <p className="consent-banner__text">
            {t('privacy.banner.text')} <Link to="/privacy">{t('privacy.policyLink')}</Link>
          </p>
          <div className="consent-banner__actions">
            <button type="button" className="btn" onClick={() => apply(ESSENTIAL_ONLY)}>
              {t('privacy.essentialOnly')}
            </button>
            <button type="button" className="btn" onClick={() => apply(ALL)}>
              {t('privacy.acceptAll')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={openSettings}>
              {t('privacy.customize')}
            </button>
          </div>
        </section>
      )}
      <ConsentSettings open={settingsOpen} onSave={apply} />
    </>
  );
}

function ConsentSettings({ open, onSave }: { open: boolean; onSave: (c: ConsentChoice) => void }) {
  const { t } = useTranslation();
  const current = useConsentStore((s) => s.choice);
  const close = useConsentStore((s) => s.closeSettings);
  const [draft, setDraft] = useState<ConsentChoice>(ESSENTIAL_ONLY);

  // Start from the saved choice each time the dialog opens.
  useEffect(() => {
    if (open) setDraft(current ?? ESSENTIAL_ONLY);
  }, [open, current]);

  const categories: { key: keyof ConsentChoice | 'essential'; locked?: boolean }[] = [
    { key: 'essential', locked: true },
    { key: 'preferences' },
    { key: 'deviceDetails' },
  ];

  return (
    <Modal
      open={open}
      title={t('privacy.settings.title')}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn" onClick={() => onSave(ESSENTIAL_ONLY)}>
            {t('privacy.essentialOnly')}
          </button>
          <button type="button" className="btn" onClick={() => onSave(ALL)}>
            {t('privacy.acceptAll')}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onSave(draft)}>
            {t('privacy.settings.save')}
          </button>
        </>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        {t('privacy.settings.intro')}{' '}
        <Link to="/privacy" onClick={close}>
          {t('privacy.policyLink')}
        </Link>
      </p>
      <ul className="consent-list">
        {categories.map(({ key, locked }) => {
          const checked = locked ? true : draft[key as keyof ConsentChoice];
          const id = `consent-${key}`;
          return (
            <li key={key} className="consent-list__item">
              <div className="consent-list__text">
                <label htmlFor={id} className="consent-list__name">
                  {t(`privacy.category.${key}.name`)}
                  {locked && <span className="chip">{t('privacy.alwaysOn')}</span>}
                </label>
                <p className="consent-list__desc">{t(`privacy.category.${key}.desc`)}</p>
              </div>
              <input
                id={id}
                type="checkbox"
                role="switch"
                className="switch"
                checked={checked}
                disabled={locked}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.checked }) as ConsentChoice)
                }
              />
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
