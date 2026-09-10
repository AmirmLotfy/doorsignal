import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError, type Principal } from './types';
import { config } from './secrets';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function equal(a: string, b: string) { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
export async function sign(value: Record<string, unknown>, ttlSeconds: number) {
  const payload = Buffer.from(JSON.stringify({ ...value, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  return `${payload}.${createHmac('sha256', (await config()).signingKey).update(payload).digest('base64url')}`;
}
export async function verify<T>(token: string, purpose: string): Promise<T> {
  if (token.length > 4096) throw new AppError(401, 'This link is invalid or expired.');
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new AppError(401, 'This link is invalid or expired.');
  const expected = createHmac('sha256', (await config()).signingKey).update(payload).digest('base64url');
  if (!equal(signature, expected)) throw new AppError(401, 'This link is invalid or expired.');
  let value;
  try { value = JSON.parse(Buffer.from(payload, 'base64url').toString()); }
  catch { throw new AppError(401, 'This link is invalid or expired.'); }
  if (value.purpose !== purpose || !Number.isFinite(value.exp) || value.exp <= Date.now() / 1000) throw new AppError(401, 'This link is invalid or expired.');
  return value;
}
export function cookies(request: Request) {
  return Object.fromEntries((request.headers.get('cookie') || '').split(';').map(x => x.trim().split(/=(.*)/s).slice(0, 2)).filter(x => x.length === 2));
}
export function cookie(name: string, value: string, seconds = 86400) {
  const secure = (process.env.APP_URL || '').startsWith('https://');
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure ? '; Secure' : ''}`;
}
export function checkOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  const allowed = new URL(process.env.APP_URL || request.url).origin;
  if (origin !== allowed) throw new AppError(403, 'This action must be made from DoorSignal.');
}
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;
export async function authenticate(request: Request): Promise<Principal> {
  const jar = cookies(request);
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (bearer?.startsWith('dsk_')) {
    const configured = (await config()).integrationKeyHash;
    if (!configured || !equal(digest(bearer), configured)) throw new AppError(401, 'Invalid integration key.');
    return { siteId: 'site:doorsignal', subject: 'expected-arrivals-api', role: 'integration', mode: 'live' };
  }
  if (jar.ds_operator || bearer) {
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) throw new AppError(503, 'Operator sign-in is not configured.');
    verifier ||= CognitoJwtVerifier.create({ userPoolId: process.env.COGNITO_USER_POOL_ID, clientId: process.env.COGNITO_CLIENT_ID, tokenUse: 'access' });
    try {
      const payload = await verifier.verify(jar.ds_operator || bearer!);
      if (!payload['cognito:groups']?.includes('operators')) throw new Error('Missing operator group');
      if (!bearer) checkOrigin(request);
      return { siteId: 'site:doorsignal', subject: payload.sub, role: 'operator', mode: 'live' };
    } catch { throw new AppError(401, 'Your operator session expired. Please sign in again.'); }
  }
  if (jar.ds_demo) {
    checkOrigin(request);
    const value = await verify<Principal>(jar.ds_demo, 'demo');
    if (value.role !== 'judge' || value.mode !== 'replay' || !/^judge:[a-f0-9-]{36}$/.test(value.siteId)) throw new AppError(401, 'Invalid demo session.');
    return value;
  }
  throw new AppError(401, 'Start the judge demo or sign in to continue.');
}
export async function newDemo() {
  const principal: Principal = { siteId: `judge:${randomUUID()}`, subject: 'Demo host', mode: 'replay', role: 'judge' };
  return { principal, token: await sign({ ...principal, purpose: 'demo' }, 86400) };
}
export function requireOperator(principal: Principal) { if (principal.role !== 'operator') throw new AppError(403, 'Operator access is required.'); }
export function requireActions(principal: Principal) { if (principal.role === 'integration') throw new AppError(403, 'This key can only manage expected arrivals.'); }
