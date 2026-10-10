export type Locale = 'en' | 'pt-BR' | 'de';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  locale: Locale;
  /** Gates content authoring (§ admin): only 'admin' may create questions/material. */
  role: UserRole;
  /** The privacy policy version the user accepted, if any. */
  privacyVersion?: string;
}
