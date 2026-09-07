import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Locale } from '@/shared/types';

import de from './de.json';
import en from './en.json';
import ptBR from './pt-BR.json';

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'de', label: 'Deutsch' },
];

export function initI18n(initialLocale: Locale) {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        'pt-BR': { translation: ptBR },
        de: { translation: de },
      },
      lng: initialLocale,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export default i18n;
