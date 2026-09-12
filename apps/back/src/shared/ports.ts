import { randomUUID } from 'node:crypto';
export interface Runtime { id(): string; now(): Date }
export const runtime: Runtime = { id: randomUUID, now: () => new Date() };
export interface Actor { id: string; roles: string[] }
export const publicRoles = ['affected', 'donor', 'professional', 'organization'] as const;
export function hasRole(actor: Actor, ...roles: string[]) { return actor.roles.some(role => roles.includes(role)); }
