import type { StateStorage } from 'zustand/middleware';

import { hasPreferencesConsent } from './consent';

/**
 * localStorage that only writes with "preferences" consent. Without it,
 * theme and language last for the page load and nothing is stored.
 */
export const consentAwareStorage: StateStorage = {
  getItem: (name) => {
    try {
      return hasPreferencesConsent() ? localStorage.getItem(name) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (hasPreferencesConsent()) localStorage.setItem(name, value);
    } catch {
      // storage unavailable
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // storage unavailable
    }
  },
};
