import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AppError, id, ringEnvelope, type DoorEvent } from './types';
import { config, saveConfiguration } from './secrets';
import { item, type Store } from './store';
import { digest } from './auth';

const BASE = 'https://api.amazonvision.com';
export function verifyRingSignature(raw: Uint8Array, signature: string, secret: string) {
  if (!secret || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
}
export function parseWebhook(raw: Uint8Array): DoorEvent {
  const value = ringEnvelope.parse(JSON.parse(Buffer.from(raw).toString('utf8')));
  if (value.data.attributes.timestamp > Date.now() + 300000) throw new AppError(400, 'Event timestamp is in the future.');
  return {
    id: value.data.id, requestId: value.meta.request_id, accountId: value.meta.account_id,
    deviceId: value.data.attributes.source, type: value.data.type,
    occurredAt: new Date(value.data.attributes.timestamp).toISOString(),
    source: 'ring_webhook', acceptedAt: new Date().toISOString(),
  };
}
const resource = z.object({ id, type: z.string(), attributes: z.record(z.unknown()).default({}), relationships: z.record(z.object({ data: z.object({ id: z.string(), type: z.string() }).optional() }).passthrough()).optional() });
const collection = z.object({ data: z.array(resource).max(1000), included: z.array(resource).optional(), links: z.object({ next: z.string().nullable().optional() }).optional() });
export type RingDevice = { id: string; name: string; status: 'online' | 'offline' | 'unknown'; capabilities: Record<string, unknown> };
export class RingClient {
  constructor(private token: string, private expiresAt: number, private fetcher: typeof fetch = fetch, private evidence?: (method: string, path: string, status: number, durationMs: number) => Promise<void>) {}
  private async request(route: string, init: RequestInit = {}) {
    if (Date.now() >= this.expiresAt) throw new AppError(401, 'Ring playground session expired. Reconnect with a fresh token.');
    const url = new URL(route, BASE);
    if (url.origin !== BASE || !url.pathname.startsWith('/v1/')) throw new AppError(400, 'Invalid Ring endpoint.');
    const started = performance.now();
    let response: Response;
    try {
      response = await this.fetcher(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${this.token}`, ...(init.headers || {}) } });
    } catch { throw new AppError(503, 'Ring did not respond. Please try again.'); }
    await this.evidence?.(init.method || 'GET', url.pathname, response.status, Math.round(performance.now() - started));
    if (response.status === 401 || response.status === 403) { await response.body?.cancel(); throw new AppError(401, 'Ring access expired or permission is missing. Reconnect to the playground.'); }
    if (response.status === 429) { await response.body?.cancel(); throw new AppError(429, 'Ring is rate limiting requests. Please wait before trying again.'); }
    if (!response.ok && response.status !== 303 && !(init.method === 'DELETE' && response.status === 404)) {
      await response.body?.cancel(); throw new AppError(502, `Ring returned HTTP ${response.status}. The device or recording may be unavailable.`);
    }
    return response;
  }
  async account() {
    const result = z.object({ data: z.object({ id }) }).parse(await (await this.request('/v1/users/me')).json());
    return result.data.id;
  }
  async devices(): Promise<RingDevice[]> {
    const result = collection.parse(await (await this.request('/v1/devices?include=status,capabilities')).json());
    return result.data.filter(x => x.type === 'devices').map(device => {
      const related = (name: string) => {
        const link = device.relationships?.[name]?.data;
        return result.included?.find(x => x.id === link?.id && x.type === link?.type)?.attributes || {};
      };
      const status = related('status');
      const online = status.online === true;
      const offline = status.online === false;
      return { id: device.id, name: typeof device.attributes.name === 'string' ? device.attributes.name : 'Ring device', status: online ? 'online' : offline ? 'offline' : 'unknown', capabilities: related('capabilities') };
    });
  }
  async history(deviceId: string, accountId: string): Promise<DoorEvent[]> {
    id.parse(deviceId);
    let route: string | null | undefined = `/v1/history/devices/${encodeURIComponent(deviceId)}/events?event_types=ding,motion`;
    const events: DoorEvent[] = [];
    const seen = new Set<string>();
    for (let page = 0; page < 3 && route; page++) {
      if (seen.has(route)) break;
      seen.add(route);
      const result = collection.parse(await (await this.request(route)).json());
      for (const row of result.data) {
        const start = Number(row.attributes.start);
        const type = row.attributes.event_type;
        if (row.type !== 'history-events' || row.relationships?.source?.data?.id !== deviceId || !Number.isFinite(start)) continue;
        if (start < Date.now() - 86400000 || start > Date.now() + 300000) continue;
        if (type !== 'ding' && !(typeof type === 'string' && type.startsWith('motion'))) continue;
        events.push({ id: row.id, requestId: `history:${row.id}`, accountId, deviceId,
          type: type === 'ding' ? 'button_press' : 'motion_detected', occurredAt: new Date(start).toISOString(), source: 'ring_history', acceptedAt: new Date().toISOString() });
      }
      route = result.data.length ? result.links?.next : null;
    }
    return events;
  }
  async startStream(deviceId: string, offer: string) {
    id.parse(deviceId);
    if (!offer.startsWith('v=0') || offer.length > 60000 || /a=sendrecv|a=sendonly/.test(offer) || !offer.includes('m=video')) throw new AppError(400, 'A receive-only video SDP offer is required.');
    const prefix = `/v1/devices/${encodeURIComponent(deviceId)}/media/streaming/whep/sessions`;
    const response = await this.request(prefix, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer });
    const location = response.headers.get('location');
    const answer = await response.text();
    if (response.status !== 201 || !location || !answer.startsWith('v=0')) throw new AppError(502, 'Ring returned an incomplete streaming session.');
    const url = new URL(location, BASE);
    if (url.origin !== BASE || !url.pathname.startsWith(`${prefix}/`) || url.search || url.hash) throw new AppError(502, 'Ring returned an invalid session URL.');
    return { answer, location: url.href };
  }
  async closeStream(deviceId: string, location: string) {
    const url = new URL(location, BASE);
    const prefix = `/v1/devices/${encodeURIComponent(id.parse(deviceId))}/media/streaming/whep/sessions/`;
    if (url.origin !== BASE || !url.pathname.startsWith(prefix) || url.search || url.hash) throw new AppError(400, 'Invalid stream session.');
    const response = await this.request(url.pathname, { method: 'DELETE' });
    await response.body?.cancel();
  }
  async snapshot(deviceId: string, timestamp: number) {
    const response = await this.request(`/v1/devices/${encodeURIComponent(id.parse(deviceId))}/media/image/download`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'at_timestamp', timestamp, image_options: { format: 'jpeg' } }),
    });
    // A redirect is intentionally treated as unavailable until its media-host allowlist is configured.
    // Never forward Ring credentials to an arbitrary redirect or store image bytes.
    if (response.status === 303) { await response.body?.cancel(); throw new AppError(503, 'Ring returned a media redirect; scene information is unavailable.'); }
    if (!(response.headers.get('content-type') || '').startsWith('image/jpeg')) { await response.body?.cancel(); throw new AppError(502, 'Ring did not return a JPEG image.'); }
    const reader = response.body?.getReader();
    if (!reader) throw new AppError(502, 'Ring returned no image.');
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length;
        if (length > 3_500_000) throw new AppError(413, 'Image exceeds the analysis size limit.'); chunks.push(part.value); }
    } finally { await reader.cancel(); }
    return Buffer.concat(chunks);
  }
}
export async function configuredRing(store: Store, siteId = 'site:doorsignal') {
  const value = await config();
  if (!value.ringAccessToken || !value.ringExpiresAt || !value.ringAccountId) throw new AppError(401, 'Connect the Ring playground to use live devices.');
  const evidence = async (method: string, route: string, status: number, durationMs: number) => {
    const at = new Date().toISOString();
    const record = item(siteId, `evidence:${at}:${digest(route).slice(0, 8)}`, { service: 'Ring', method, path: route, status, durationMs, at });
    await store.transact([{ item: record, expectedVersion: null }]);
  };
  return { client: new RingClient(value.ringAccessToken, value.ringExpiresAt, fetch, evidence), accountId: value.ringAccountId };
}
export async function connectRing(store: Store, token: string) {
  const expiresAt = Date.now() + 29 * 60000;
  const client = new RingClient(token, expiresAt);
  const accountId = await client.account();
  const devices = await client.devices();
  await saveConfiguration({ ringAccessToken: token, ringExpiresAt: expiresAt, ringAccountId: accountId });
  for (const device of devices) {
    const key = `device:${device.id}`;
    const old = await store.get('site:doorsignal', key);
    await store.transact([{ item: item('site:doorsignal', key, { ...device, accountId }, old?.version), expectedVersion: old?.version ?? null }]);
  }
  return { devices, expiresAt };
}
