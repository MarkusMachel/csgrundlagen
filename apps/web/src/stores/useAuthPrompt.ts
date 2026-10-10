import { create } from 'zustand';

/** Thrown when someone closes the sign-in prompt instead of signing in. */
export class SignInCancelled extends Error {
  constructor() {
    super('sign-in cancelled');
    this.name = 'SignInCancelled';
  }
}

// a plain boolean, not a type guard: the error has the same shape as Error
export const isSignInCancelled = (err: unknown): boolean => err instanceof SignInCancelled;

interface AuthPromptState {
  open: boolean;
  mode: 'login' | 'signup';
  /** Settles the requestSignIn() promises waiting on this prompt. */
  waiting: { resolve: () => void; reject: (err: Error) => void }[];
  setMode: (mode: 'login' | 'signup') => void;
  /** Signed in: close the prompt and let the waiting actions go ahead. */
  signedIn: () => void;
  /** Closed without signing in: the waiting actions fail with SignInCancelled. */
  cancel: () => void;
}

export const useAuthPrompt = create<AuthPromptState>()((set, get) => ({
  open: false,
  mode: 'login',
  waiting: [],
  setMode: (mode) => set({ mode }),
  signedIn: () => {
    const { waiting } = get();
    set({ open: false, waiting: [] });
    waiting.forEach((w) => w.resolve());
  },
  cancel: () => {
    const { waiting } = get();
    set({ open: false, waiting: [] });
    waiting.forEach((w) => w.reject(new SignInCancelled()));
  },
}));

/**
 * Opens the sign-in modal and resolves once the user has signed in (or
 * signed up), so whatever needed an account can carry on. Rejects with
 * SignInCancelled if they close it.
 */
export function requestSignIn(mode: 'login' | 'signup' = 'login'): Promise<void> {
  return new Promise((resolve, reject) => {
    useAuthPrompt.setState((s) => ({
      open: true,
      mode: s.open ? s.mode : mode,
      waiting: [...s.waiting, { resolve, reject }],
    }));
  });
}
