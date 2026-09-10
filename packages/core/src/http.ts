import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { authenticate, checkOrigin, cookie, cookies, newDemo, requireActions, requireOperator, sign, verify, digest } from './auth';
import { config, saveConfiguration } from './secrets';
import { AppError, id, type Expected, type Notification, type SiteSettings } from './types';
import { getStore, item, limit, type Store } from './store';
import { acceptEvent, caseAction, checkinLink, checkinStatus, createExpected, deleteSiteData, getCase, listCases, processEvent, replay, settings, submitCheckin, versioned } from './workflows';
import { configuredRing, connectRing, parseWebhook, verifyRingSignature, type RingDevice } from './ring';
import { contextHelp } from './intelligence';

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
async function body(request: Request, max = 65536) {
  if (Number(request.headers.get('content-length')) > max) throw new AppError(413, 'Request is too large.');
  const text = await request.text();
  if (Buffer.byteLength(text) > max) throw new AppError(413, 'Request is too large.');
  try { return JSON.parse(text); } catch { throw new AppError(400, 'Send a valid JSON request.'); }
}
async function authRoute(request: Request, route: string, store: Store) {
  const url = new URL(request.url);
  if (route === '/auth/demo' && request.method === 'POST') {
    checkOrigin(request); await limit(store, 'budget', 'demo-sessions', 100);
    const value = await newDemo();
    return json({ mode: 'replay' }, 201, { 'Set-Cookie': cookie('ds_demo', value.token) });
  }
  if (route === '/auth/logout' && request.method === 'POST') {
    checkOrigin(request);
    const response = json({ ok: true });
    response.headers.append('Set-Cookie', cookie('ds_demo', '', 0)); response.headers.append('Set-Cookie', cookie('ds_operator', '', 0));
    return response;
  }
  if (route === '/auth/login' && request.method === 'GET') {
    if (!process.env.COGNITO_DOMAIN || !process.env.COGNITO_CLIENT_ID) throw new AppError(503, 'Operator access will be available after AWS deployment. You can use the judge demo now.');
    const verifier = randomBytes(32).toString('base64url'); const state = randomUUID();
    const authorization = new URL(`https://${process.env.COGNITO_DOMAIN}/oauth2/authorize`);
    authorization.search = new URLSearchParams({ response_type: 'code', client_id: process.env.COGNITO_CLIENT_ID, redirect_uri: `${process.env.APP_URL}/api/auth/callback`, scope: 'openid email', state, code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') }).toString();
    return new Response(null, { status: 302, headers: { Location: authorization.href, 'Cache-Control': 'no-store', 'Set-Cookie': cookie('ds_oauth', await sign({ purpose: 'oauth', state, verifier }, 600), 600) } });
  }
  if (route === '/auth/callback' && request.method === 'GET') {
    const saved = await verify<{ state: string; verifier: string }>(cookies(request).ds_oauth || '', 'oauth');
    if (url.searchParams.get('state') !== saved.state || !url.searchParams.get('code')) throw new AppError(401, 'Sign-in state did not match. Please start again.');
    const result = await fetch(`https://${process.env.COGNITO_DOMAIN}/oauth2/token`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code')!, client_id: process.env.COGNITO_CLIENT_ID!, redirect_uri: `${process.env.APP_URL}/api/auth/callback`, code_verifier: saved.verifier }) });
    if (!result.ok) throw new AppError(401, 'Sign-in could not be completed. Please start again.');
    const value = z.object({ access_token: z.string(), expires_in: z.number() }).parse(await result.json());
    const response = new Response(null, { status: 302, headers: { Location: `${process.env.APP_URL}/today`, 'Cache-Control': 'no-store' } });
    response.headers.append('Set-Cookie', cookie('ds_operator', value.access_token, Math.min(3600, value.expires_in)));
    response.headers.append('Set-Cookie', cookie('ds_oauth', '', 0));
    return response;
  }
}
export async function handleRequest(request: Request, store: Store = getStore()): Promise<Response> {
  try {
    const url = new URL(request.url); const route = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
    const method = request.method;
    if (route === '/health' && method === 'GET') return json({ status: 'ok', application: 'DoorSignal', storage: process.env.DOORSIGNAL_TABLE ? 'DynamoDB' : 'local-file' });
    if (route.startsWith('/auth/')) { const response = await authRoute(request, route, store); if (response) return response; }
    if (route === '/webhooks/ring' && method === 'POST') {
      if (Number(request.headers.get('content-length')) > 65536) throw new AppError(413, 'Payload too large.');
      const raw = new Uint8Array(await request.arrayBuffer());
      if (raw.length > 65536) throw new AppError(413, 'Payload too large.');
      const value = await config();
      if (!value.ringWebhookSecret) throw new AppError(503, 'Webhook signing is not configured.');
      if (!verifyRingSignature(raw, request.headers.get('x-signature') || '', value.ringWebhookSecret)) throw new AppError(401, 'Invalid Ring signature.');
      const event = parseWebhook(raw);
      const result = await acceptEvent(store, 'site:doorsignal', event);
      // DynamoDB Streams is the durable hand-off. No background promise is left running after acknowledgment.
      if (!process.env.DOORSIGNAL_TABLE) await processEvent(store, 'site:doorsignal', result.key);
      return json({ accepted: true, duplicate: result.duplicate });
    }
    if (route === '/checkin' && method === 'POST') { checkOrigin(request); return json(await submitCheckin(store, await body(request)), 201); }
    if (route === '/checkin/status' && method === 'GET') return json(await checkinStatus(store, url.searchParams.get('token') || ''));
    if (route === '/checkin/info' && method === 'GET') {
      const value = await verify<{ siteId: string; expectedId?: string }>(url.searchParams.get('token') || '', 'checkin');
      const site = await settings(store, value.siteId);
      return json({ siteName: site.name, mode: value.siteId.startsWith('judge:') ? 'replay' : 'live', retentionDays: value.siteId.startsWith('judge:') ? 1 : site.retentionDays });
    }
    const principal = await authenticate(request);
    await limit(store, 'budget', 'api-daily', 5000);
    if (principal.role === 'integration' && !route.startsWith('/v1/expected-arrivals')) throw new AppError(403, 'This integration key is scoped to expected arrivals.');
    if (route === '/session' && method === 'GET') return json({ principal, settings: await settings(store, principal.siteId) });
    if (route === '/cases' && method === 'GET') return json({ cases: await listCases(store, principal.siteId) });
    if (route === '/notifications' && method === 'GET') return json({ notifications: (await store.list<Notification>(principal.siteId, 'notification:')).map(versioned).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
    if (route === '/evidence' && method === 'GET') return json({ evidence: (await store.list(principal.siteId, 'evidence:')).map(x => x.data).slice(-50) });
    if (route === '/v1/expected-arrivals') {
      if (method === 'GET') return json({ data: (await store.list<Expected>(principal.siteId, 'expected:')).map(versioned).sort((a,b) => a.startsAt.localeCompare(b.startsAt)) });
      if (method === 'POST') return json({ data: await createExpected(store, principal, await body(request)) }, 201);
    }
    const expectedDelete = route.match(/^\/v1\/expected-arrivals\/([^/]+)$/);
    if (expectedDelete && method === 'DELETE') {
      const row = await store.get(principal.siteId, `expected:${id.parse(expectedDelete[1])}`);
      if (!row) throw new AppError(404, 'Expected arrival not found.');
      await store.transact([{ item: row, expectedVersion: row.version, delete: true }]); return json({ deleted: true });
    }
    const match = route.match(/^\/(?:cases|v1\/arrival-cases)\/([^/]+)(?:\/(action|resolve|assist))?$/);
    if (match) {
      const caseId = id.parse(match[1]);
      if (method === 'GET' && !match[2]) return json({ data: versioned(await getCase(store, principal.siteId, caseId)) });
      if (method === 'POST' && ['action', 'resolve'].includes(match[2])) return json({ data: await caseAction(store, principal, caseId, await body(request)) });
      if (method === 'POST' && match[2] === 'assist') { requireActions(principal); const arrival = (await getCase(store, principal.siteId, caseId)).data; return json(await contextHelp(store, principal.siteId, { kind: arrival.kind, status: arrival.status, match: arrival.match })); }
    }
    if (route === '/simulate' && method === 'POST') return json(await replay(store, principal, z.object({ story: z.string() }).strict().parse(await body(request)).story), 201);
    if (route === '/checkin/link' && method === 'POST') {
      requireActions(principal); const value = z.object({ expectedId: id.optional() }).strict().parse(await body(request));
      if (value.expectedId && !await store.get(principal.siteId, `expected:${value.expectedId}`)) throw new AppError(404, 'Expected arrival not found.');
      return json({ url: `${process.env.APP_URL || url.origin}${await checkinLink(principal.siteId, value.expectedId)}`, expiresIn: 86400 });
    }
    if (route === '/settings' && method === 'PUT') {
      requireActions(principal);
      const value = z.object({ name: z.string().trim().min(1).max(80), timeZone: z.string().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }), retentionDays: z.literal(7), emailEnabled: z.boolean() }).strict().parse(await body(request));
      if (principal.mode === 'replay') value.emailEnabled = false;
      const previous = await store.get<SiteSettings>(principal.siteId, 'settings');
      await store.transact([{ item: item(principal.siteId, 'settings', value, previous?.version, principal.mode === 'replay' ? 1 : 365), expectedVersion: previous?.version ?? null }]); return json(value);
    }
    if (route === '/data' && method === 'DELETE') {
      requireActions(principal);
      const value = z.object({ confirmation: z.literal('DELETE SITE DATA') }).strict().parse(await body(request));
      if (value.confirmation) await deleteSiteData(store, principal.siteId);
      return json({ deleted: true });
    }
    if (route === '/integrations' && method === 'GET') {
      const value = principal.mode === 'live' ? await config() : null;
      return json({ mode: principal.mode, ring: value?.ringAccessToken && (value.ringExpiresAt || 0) > Date.now() ? 'connected' : 'reconnect', expiresAt: value?.ringExpiresAt,
        email: principal.mode === 'replay' ? 'disabled_in_demo' : value?.notificationEmail && process.env.SES_FROM ? 'configured' : 'not_configured',
        expectedApi: value?.integrationKeyHash ? 'configured' : 'not_configured', storage: process.env.DOORSIGNAL_TABLE ? 'DynamoDB' : 'Local durable file', bedrock: principal.mode === 'live' && process.env.BEDROCK_ENABLED === 'true' ? 'enabled' : 'disabled' });
    }
    if (route.startsWith('/ring/') || route.startsWith('/integrations/')) requireOperator(principal);
    if (route === '/integrations/key' && method === 'POST') { const key = `dsk_${randomBytes(32).toString('hex')}`; await saveConfiguration({ integrationKeyHash: digest(key) }); return json({ key }); }
    if (route === '/integrations/email' && method === 'POST') { const value = z.object({ email: z.string().email().max(200) }).strict().parse(await body(request)); await saveConfiguration({ notificationEmail: value.email }); return json({ configured: true }); }
    if (route === '/ring/connect' && method === 'POST') { const value = z.object({ token: z.string().trim().min(20).max(16000) }).strict().parse(await body(request)); return json(await connectRing(store, value.token)); }
    if (route === '/ring/disconnect' && method === 'POST') { await saveConfiguration({ ringAccessToken: '', ringExpiresAt: 0, ringAccountId: '' }); return json({ disconnected: true }); }
    if (route === '/ring/devices' && method === 'GET') {
      const { client, accountId } = await configuredRing(store, principal.siteId); const devices = await client.devices();
      for (const device of devices) { const old = await store.get(principal.siteId, `device:${device.id}`); await store.transact([{ item: item(principal.siteId, `device:${device.id}`, { ...device, accountId }, old?.version), expectedVersion: old?.version ?? null }]); }
      return json({ devices });
    }
    const deviceRoute = route.match(/^\/ring\/devices\/([^/]+)\/(history|stream)$/);
    if (deviceRoute) {
      const deviceId = id.parse(decodeURIComponent(deviceRoute[1]));
      const device = await store.get<RingDevice>(principal.siteId, `device:${deviceId}`);
      if (!device) throw new AppError(404, 'Device is not connected to this site.');
      const { client, accountId } = await configuredRing(store, principal.siteId);
      await limit(store, principal.siteId, 'ring-requests', 200);
      if (deviceRoute[2] === 'history' && method === 'POST') {
        const events = await client.history(deviceId, accountId); let added = 0;
        for (const event of events) { const accepted = await acceptEvent(store, principal.siteId, event); if (!accepted.duplicate) added++; if (!process.env.DOORSIGNAL_TABLE) await processEvent(store, principal.siteId, accepted.key); }
        return json({ retrieved: events.length, accepted: added, processing: process.env.DOORSIGNAL_TABLE ? 'queued' : 'completed' });
      }
      if (deviceRoute[2] === 'stream' && method === 'POST') {
        const fresh = (await client.devices()).find(x => x.id === deviceId);
        if (!fresh || fresh.status !== 'online') throw new AppError(409, 'This device is offline or its status is unknown.');
        if (!fresh.capabilities.video) throw new AppError(409, 'This device does not advertise video support.');
        const value = z.object({ offer: z.string().max(60000) }).strict().parse(await body(request));
        const stream = await client.startStream(deviceId, value.offer);
        const token = await sign({ purpose: 'stream', siteId: principal.siteId, deviceId, location: stream.location }, 120);
        return json({ answer: stream.answer, session: token, maxSeconds: 30 });
      }
      if (deviceRoute[2] === 'stream' && method === 'DELETE') {
        const value = z.object({ session: z.string().max(4096) }).strict().parse(await body(request));
        const stream = await verify<{ siteId: string; deviceId: string; location: string }>(value.session, 'stream');
        if (stream.siteId !== principal.siteId || stream.deviceId !== deviceId) throw new AppError(403, 'Invalid stream owner.');
        await client.closeStream(deviceId, stream.location); return json({ closed: true });
      }
    }
    return json({ error: 'Endpoint not found.' }, 404);
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: error.issues.map(x => x.message).join(' ') }, 400);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON payload.' }, 400);
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    console.error(JSON.stringify({ event: 'request_failed', errorType: (error as Error).name || 'Error' }));
    return json({ error: 'This request could not be completed. Your data has not been reported as saved. Please retry.' }, 503);
  }
}
