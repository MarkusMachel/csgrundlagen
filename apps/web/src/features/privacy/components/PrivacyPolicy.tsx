import { useTranslation } from 'react-i18next';

import type { Locale } from '@/shared/types';

import { PRIVACY_POLICY_VERSION } from '../consent';
import { policyContent } from '../policyContent';

const contact = () => import.meta.env.VITE_PRIVACY_CONTACT || undefined;

/** The privacy policy text in the current language. */
export function PrivacyPolicy() {
  const { t, i18n } = useTranslation();
  const sections =
    policyContent[(i18n.language as Locale) in policyContent ? (i18n.language as Locale) : 'en'];
  const fill = (s: string) => s.split('{contact}').join(contact() ?? t('privacy.page.operator'));

  return (
    <article className="policy">
      <p className="muted policy__version">
        {t('privacy.page.version', { version: PRIVACY_POLICY_VERSION })}
      </p>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p}>{fill(p)}</p>
          ))}
          {section.items && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{fill(item)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
