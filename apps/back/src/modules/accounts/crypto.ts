import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { PasswordHasher, Tokens } from './model.js';
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    (error, key) => error ? reject(error) : resolve(key)));
}
export class ScryptPasswords implements PasswordHasher {
  async hash(password: string) {
    const salt = randomBytes(16).toString('hex');
    return 'scrypt32768$' + salt + '$' + (await derive(password, salt)).toString('hex');
  }
  async verify(password: string, encoded: string | undefined) {
    const [algorithm, salt, expected] = (encoded ?? '').split('$');
    const validFormat = algorithm === 'scrypt32768' && /^[a-f0-9]{32}$/.test(salt ?? '') && /^[a-f0-9]{128}$/.test(expected ?? '');
    const key = await derive(password, validFormat ? salt! : '00000000000000000000000000000000');
    return validFormat && timingSafeEqual(key, Buffer.from(expected!, 'hex'));
  }
}
export const secureTokens: Tokens = {
  issue: () => randomBytes(32).toString('hex'), hash: token => createHash('sha256').update(token).digest('hex')
};
