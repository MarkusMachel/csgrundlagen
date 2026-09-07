export type Locale = 'en' | 'pt-BR' | 'de';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  locale: Locale;
}
