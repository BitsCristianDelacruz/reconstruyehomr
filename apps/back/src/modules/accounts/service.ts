import { AppError, requireThat } from '../../shared/errors.js';
import { publicRoles, type Runtime } from '../../shared/ports.js';
import type { CatalogService } from '../catalogs/catalogs.js';
import { ownProfile, type Account, type AccountRepository, type PasswordHasher, type ProfileInput, type Tokens } from './model.js';
export class AccountService {
  constructor(private readonly repo: AccountRepository, private readonly passwords: PasswordHasher,
    private readonly tokens: Tokens, private readonly clock: Runtime, private readonly catalogs: Pick<CatalogService, 'isActive'>) {}
  private async validateProfile(profile: ProfileInput) {
    requireThat(profile.roles.length > 0 && profile.roles.every(role => publicRoles.includes(role as typeof publicRoles[number])), 400, 'Rol no permitido');
    requireThat(await this.catalogs.isActive('territory', profile.territory), 400, 'Selecciona un territorio disponible');
    requireThat(!profile.contactConsent || !!profile.phone, 400, 'Indica un teléfono para habilitar WhatsApp');
  }
  async register(input: ProfileInput & { email: string; password: string; privacyConsent: true }) {
    await this.validateProfile(input);
    requireThat(input.privacyConsent === true, 400, 'Debes aceptar el tratamiento de datos de desarrollo');
    requireThat(!await this.repo.findByEmail(input.email), 409, 'No se puede registrar ese correo');
    const account: Account = { id: this.clock.id(), name: input.name, email: input.email, territory: input.territory,
      roles: [...new Set(input.roles)], phone: input.phone, contactConsent: input.contactConsent,
      state: 'active', passwordHash: await this.passwords.hash(input.password), createdAt: this.clock.now() };
    await this.repo.create(account);
    return ownProfile(account);
  }
  async login(email: string, password: string) {
    const account = await this.repo.findByEmail(email);
    const valid = await this.passwords.verify(password, account?.passwordHash);
    requireThat(valid && account?.state === 'active', 401, 'Correo o contraseña incorrectos');
    const token = this.tokens.issue();
    await this.repo.saveSession({ hash: this.tokens.hash(token), accountId: account.id,
      expiresAt: new Date(this.clock.now().getTime() + 12 * 60 * 60 * 1000) });
    return { token, profile: ownProfile(account) };
  }
  async authenticate(token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
    return this.repo.sessionAccount(this.tokens.hash(token), this.clock.now());
  }
  async logout(token: string | undefined) { if (token) await this.repo.revokeSession(this.tokens.hash(token)); }
  async update(id: string, input: ProfileInput) {
    await this.validateProfile(input);
    const current = await this.repo.findById(id);
    requireThat(current?.state === 'active', 401, 'Inicia sesión nuevamente');
    const roles = [...new Set([...input.roles, ...current.roles.filter(role => !publicRoles.includes(role as typeof publicRoles[number]))])];
    await this.repo.updateProfile(id, { ...input, roles });
    return ownProfile({ ...current, ...input, roles });
  }
  async deactivate(id: string, confirmed: boolean) {
    requireThat(confirmed, 400, 'Confirma la solicitud de desactivación');
    await this.repo.deactivate(id);
    return { message: 'Cuenta desactivada y publicaciones retiradas de la vista pública. La eliminación definitiva depende de la política de retención pendiente.' };
  }
}
export function assertLocalAuthAllowed(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV === 'production' || env.AUTH_MODE !== 'local') throw new AppError(503, 'La autenticación local requiere AUTH_MODE=local y no se permite en producción');
}
