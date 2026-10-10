import { create } from 'zustand';

/**
 * The privacy policy version the app shows. Must match
 * store.PrivacyPolicyVersion in the Go API; bump both when the policy changes.
 */
export const PRIVACY_POLICY_VERSION = '2026-10-10';

/** localStorage key of the consent choice itself (essential: it records the choice). */
export const CONSENT_KEY = 'cft.consent';
/** localStorage key of the remembered theme and language (the "preferences" category). */
export const PREFERENCES_KEY = 'cft.ui';

export interface ConsentChoice {
  /** Remember theme and language in this browser. */
  preferences: boolean;
  /** Store what the browser reports about itself on the session. */
  deviceDetails: boolean;
}

interface StoredConsent extends ConsentChoice {
  version: string;
  decidedAt: string;
}

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredConsent) : null;
    // A choice made under an older policy is asked again.
    return parsed?.version === PRIVACY_POLICY_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

/** Read straight from storage so modules outside React (the UI store) can check it. */
export function hasPreferencesConsent(): boolean {
  return readStored()?.preferences === true;
}

interface ConsentState {
  /** null until the visitor decides. */
  choice: StoredConsent | null;
  settingsOpen: boolean;
  decide: (choice: ConsentChoice) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useConsentStore = create<ConsentState>()((set) => ({
  choice: readStored(),
  settingsOpen: false,
  decide: (choice) => {
    const stored: StoredConsent = {
      ...choice,
      version: PRIVACY_POLICY_VERSION,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
      if (!choice.preferences) localStorage.removeItem(PREFERENCES_KEY);
    } catch {
      // storage unavailable: the choice lasts for this page load
    }
    set({ choice: stored, settingsOpen: false });
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));

export const ALL: ConsentChoice = { preferences: true, deviceDetails: true };
export const ESSENTIAL_ONLY: ConsentChoice = { preferences: false, deviceDetails: false };
