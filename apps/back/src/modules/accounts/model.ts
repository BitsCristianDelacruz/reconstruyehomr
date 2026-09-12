import type { Actor } from '../../shared/ports.js';
export interface ProfileInput { name: string; territory: string; roles: string[]; phone: string | null; contactConsent: boolean }
export interface Account extends Actor, ProfileInput { email: string; passwordHash: string; state: 'active' | 'deactivation_requested' | 'disabled'; createdAt: Date }
export interface Session { hash: string; accountId: string; expiresAt: Date }
export interface AccountRepository {
  findByEmail(email: string): Promise<Account | undefined>;
  findById(id: string): Promise<Account | undefined>;
  create(account: Account): Promise<void>;
  updateProfile(id: string, profile: ProfileInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  saveSession(session: Session): Promise<void>;
  sessionAccount(hash: string, now: Date): Promise<Account | undefined>;
  revokeSession(hash: string): Promise<void>;
}
export interface PasswordHasher { hash(password: string): Promise<string>; verify(password: string, hash: string | undefined): Promise<boolean> }
export interface Tokens { issue(): string; hash(token: string): string }
export function ownProfile(account: Account) {
  return { id: account.id, email: account.email, name: account.name, territory: account.territory,
    roles: account.roles, phone: account.phone, contactConsent: account.contactConsent, state: account.state, createdAt: account.createdAt };
}
