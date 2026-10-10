import type { User } from '@/shared/types';

export interface SeedUser extends User {
  password: string;
  /** Set for accounts created through sign-up. */
  createdAt?: string;
}

export const seedUsers: SeedUser[] = [
  {
    id: 'u1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password',
    locale: 'en',
    role: 'admin',
  },
  {
    id: 'u2',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'password',
    locale: 'en',
    role: 'user',
  },
  {
    id: 'u3',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'password',
    locale: 'en',
    role: 'user',
  },
];
