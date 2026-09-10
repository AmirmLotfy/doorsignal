import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { actionInput, expectedInput, AppError, unknownScene, kind, type Arrival, type Expected, type DoorEvent, type Checkin, type Notification, type Principal, type RecordItem, type SiteSettings, type Action } from './types';
import { item, limit, type Store, type Write } from './store';
import { digest, equal, sign, verify, requireActions } from './auth';
import { config } from './secrets';
import { configuredRing, type RingDevice } from './ring';
import { analyzeScene } from './intelligence';

export const versioned = <T>(record: RecordItem<T>) => ({ ...record.data, version: record.version });
export const defaults: SiteSettings = { name: 'DoorSignal House', timeZone: 'America/New_York', retentionDays: 7, emailEnabled: false };
export async function settings(store: Store, siteId: string) { return (await store.get<SiteSettings>(siteId, 'settings'))?.data || defaults; }
const caseKey = (id: string) => `case:${id}`;
const eventKey = (event: DoorEvent) => `event:${digest(`${event.accountId}:${event.deviceId}:${event.id}`)}`;
export async function createExpected(store: Store, principal: Principal, input: unknown) {
  const value = expectedInput.parse(input);
  if (Date.parse(value.endsAt) < Date.now() - 60000 || Date.parse(value.startsAt) > Date.now() + 30 * 86400000) throw new AppError(400, 'Choose an arrival within the next 30 days.');
  await limit(store, principal.siteId, 'expected', 50);
  const expected: Expected = { ...value, id: randomUUID(), createdAt: new Date().toISOString() };
  const record = item(principal.siteId, `expected:${expected.id}`, expected, 0, Math.min(31, Math.max(7, (Date.parse(value.endsAt) - Date.now()) / 86400000 + 1)));
  await store.transact([{ item: record, expectedVersion: null }]);
  return versioned(record);
}
export async function listCases(store: Store, siteId: string) {
  return (await store.list<Arrival>(siteId, 'case:')).map(versioned).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
export async function getCase(store: Store, siteId: string, id: string) {
  const record = await store.get<Arrival>(siteId, caseKey(id));
  if (!record) throw new AppError(404, 'Arrival not found.');
  return record;
}
export async function acceptEvent(store: Store, siteId: string, event: DoorEvent) {
  if (siteId === 'site:doorsignal') {
    const device = await store.get<RingDevice & { accountId: string }>(siteId, `device:${event.deviceId}`);
    if (!device || device.data.accountId !== event.accountId) throw new AppError(403, 'This Ring account and device are not connected to this site.');
  } else if (!siteId.startsWith('judge:') || event.source !== 'demo_replay') throw new AppError(403, 'Invalid event source.');
  const key = eventKey(event);
  const requestKey = `request:${digest(`${event.accountId}:${event.requestId}`)}`;
  if (await store.get(siteId, key) || await store.get(siteId, requestKey)) return { duplicate: true, key };
  await limit(store, siteId, 'events', 200);
  try {
    await store.transact([
      { item: item(siteId, key, { ...event, processing: 'pending' }), expectedVersion: null },
      { item: item(siteId, requestKey, { eventKey: key }), expectedVersion: null },
    ]);
    return { duplicate: false, key };
  } catch (error) { if (error instanceof AppError && error.status === 409) return { duplicate: true, key }; throw error; }
}
async function notificationWrites(store: Store, siteId: string, arrival: Arrival, suffix: string): Promise<Write[]> {
  const createdAt = new Date().toISOString();
  const note: Notification = { id: `${arrival.id}:${suffix}`, caseId: arrival.id, title: arrival.title, createdAt, channel: 'in_app', state: 'sent', attempts: 0 };
  const writes: Write[] = [{ item: item(siteId, `notification:${note.id}:in_app`, note), expectedVersion: null }];
  if (!siteId.startsWith('judge:') && (await settings(store, siteId)).emailEnabled) {
    const address = (await config()).notificationEmail;
    writes.push({ item: item(siteId, `notification:${note.id}:email`, { ...note, channel: 'email', state: address && process.env.SES_FROM ? 'queued' : 'failed', error: address && process.env.SES_FROM ? undefined : 'Email recipient or SES sender is not configured.' }), expectedVersion: null });
  }
  return writes;
}
export async function processEvent(store: Store, siteId: string, key: string) {
  const accepted = await store.get<DoorEvent & { processing: string }>(siteId, key);
  if (!accepted || accepted.data.processing === 'processed') return;
  const event = accepted.data;
  if (!['button_press', 'motion_detected'].includes(event.type)) {
    const writes: Write[] = [{ item: item(siteId, key, { ...event, processing: 'processed' }, accepted.version), expectedVersion: accepted.version }];
    if (['device_online', 'device_offline', 'device_removed'].includes(event.type)) {
      const device = await store.get<RingDevice & { accountId: string }>(siteId, `device:${event.deviceId}`);
      if (device) writes.push({ item: item(siteId, device.sk, { ...device.data, status: event.type === 'device_online' ? 'online' : 'offline' }, device.version), expectedVersion: device.version, delete: event.type === 'device_removed' });
    }
    await store.transact(writes); return;
  }
  const existing = await listCases(store, siteId);
  const unpaired = existing.filter(x => x.source === 'checkin' && x.status !== 'resolved' && Math.abs(Date.parse(x.occurredAt) - Date.parse(event.occurredAt)) < 5 * 60000);
  if (unpaired.length === 1) {
    const { version, ...arrival } = unpaired[0];
    arrival.source = event.source; arrival.eventId = event.id; arrival.deviceId = event.deviceId;
    arrival.timeline.push({ at: new Date().toISOString(), actor: 'DoorSignal', text: 'A nearby door event was linked by time to this check-in. This is not visual identity verification.' });
    await store.transact([
      { item: item(siteId, caseKey(arrival.id), arrival, version), expectedVersion: version },
      { item: item(siteId, key, { ...event, processing: 'processed', caseId: arrival.id }, accepted.version), expectedVersion: accepted.version },
    ]); return arrival;
  }
  const candidates = (await store.list<Expected>(siteId, 'expected:')).filter(x => Date.parse(x.data.startsAt) <= Date.parse(event.occurredAt) && Date.parse(x.data.endsAt) >= Date.parse(event.occurredAt));
  const match = candidates.length === 1 ? candidates[0].data : undefined;
  const id = digest(`${siteId}:${event.accountId}:${event.deviceId}:${event.id}`).slice(0, 32);
  let scene = unknownScene(event.source === 'demo_replay' ? 'Demo replay uses no camera image or model inference.' : undefined);
  if (event.source !== 'demo_replay' && process.env.BEDROCK_ENABLED === 'true') {
    try { const { client } = await configuredRing(store, siteId); scene = await analyzeScene(store, siteId, await client.snapshot(event.deviceId, Date.parse(event.occurredAt))); }
    catch { scene = unknownScene('The Ring image or scene analysis was unavailable.'); }
  }
  const arrival: Arrival = {
    id, eventId: event.id, deviceId: event.deviceId, occurredAt: event.occurredAt, createdAt: new Date().toISOString(), source: event.source,
    kind: match?.kind || 'UNMATCHED', status: 'needs_review', title: match ? `${match.kind === 'DELIVERY' ? 'Possible delivery' : 'Arrival'} · ${match.name}` : 'Unscheduled arrival',
    owner: match?.host || 'Unassigned', expectedId: match?.id, match: match ? 'tentative' : 'unknown',
    reason: match ? `Within the window for ${match.name}. Confirm with a check-in or a person; timing does not identify a visitor.` : candidates.length > 1 ? 'Several arrivals overlap. Ask the visitor to check in before matching.' : 'No expected arrival covers this time. A person needs to review it.',
    scene, timeline: [{ at: event.occurredAt, actor: event.source === 'demo_replay' ? 'Demo replay' : 'Ring', text: event.type === 'button_press' ? 'Doorbell button pressed.' : 'Motion detected at the door.' }],
  };
  await store.transact([
    { item: item(siteId, caseKey(id), arrival), expectedVersion: null },
    { item: item(siteId, key, { ...event, processing: 'processed', caseId: id }, accepted.version), expectedVersion: accepted.version },
    ...await notificationWrites(store, siteId, arrival, 'arrival'),
  ]);
  return arrival;
}
export function applyAction(arrival: Arrival, action: Action, actor: string): Arrival {
  if (arrival.status === 'resolved') throw new AppError(409, 'This arrival is already closed.');
  const next: Arrival = structuredClone(arrival);
  const text: Record<Action, string> = {
    ACKNOWLEDGE: 'Host acknowledged: on my way.', RECEIVED: 'Delivery received and ready for collection.', COLLECTED: 'Delivery collected. Arrival closed.',
    CONFIRM: 'A person confirmed the arrival context.', DISMISS: 'Arrival reviewed and closed.', NOT_A_MATCH: 'The suggested match was rejected.', NOTIFY: 'A host notification was requested.', ESCALATE: 'Arrival escalated for human review.',
  };
  if (action === 'ACKNOWLEDGE') {
    if (!['waiting', 'needs_review'].includes(next.status)) throw new AppError(409, 'This arrival cannot be acknowledged in its current state.');
    next.status = 'acknowledged';
  } else if (action === 'RECEIVED') {
    if (next.kind !== 'DELIVERY' || next.status === 'received') throw new AppError(409, 'Only an open delivery can be marked received.');
    next.status = 'received'; next.match = 'human';
  } else if (action === 'COLLECTED') {
    if (next.kind !== 'DELIVERY' || next.status !== 'received') throw new AppError(409, 'Receive the delivery before marking it collected.');
    next.status = 'resolved';
  } else if (action === 'CONFIRM') {
    if (!next.expectedId || next.match === 'human') throw new AppError(409, 'There is no suggested arrival to confirm.');
    next.match = 'human'; next.status = 'waiting'; next.reason = 'The host confirmed the scheduled arrival context.';
  } else if (action === 'DISMISS') next.status = 'resolved';
  else if (action === 'NOT_A_MATCH') { next.status = 'needs_review'; next.match = 'unknown'; next.kind = 'UNMATCHED'; next.owner = 'Unassigned'; delete next.expectedId; next.title = 'Unmatched arrival'; next.reason = 'A person rejected the proposed match. Further review is needed.'; }
  else if (action === 'ESCALATE') { next.status = 'needs_review'; next.owner = 'On-call host'; }
  next.timeline.push({ at: new Date().toISOString(), actor, text: text[action] });
  if (next.timeline.length > 100) throw new AppError(429, 'This arrival has reached its action limit.');
  return next;
}
export async function caseAction(store: Store, principal: Principal, id: string, input: unknown) {
  requireActions(principal);
  const parsed = actionInput.parse(input);
  const current = await getCase(store, principal.siteId, id);
  if (current.version !== parsed.version) throw new AppError(409, 'Another host changed this arrival. Refresh before acting.');
  const next = applyAction(current.data, parsed.action, principal.role === 'judge' ? 'Demo host' : 'Host');
  const writes: Write[] = [{ item: item(principal.siteId, current.sk, next, current.version), expectedVersion: current.version }];
  const actionId = randomUUID();
  writes.push({ item: item(principal.siteId, `action:${id}:${actionId}`, { action: parsed.action, actorId: principal.subject, at: new Date().toISOString() }), expectedVersion: null });
  if (['NOTIFY', 'ESCALATE'].includes(parsed.action)) writes.push(...await notificationWrites(store, principal.siteId, next, actionId));
  await store.transact(writes);
  return versioned(writes[0].item as RecordItem<Arrival>);
}
export async function checkinLink(siteId: string, expectedId?: string, ttlSeconds = 86400) {
  const token = await sign({ purpose: 'checkin', siteId, expectedId }, ttlSeconds);
  return `/visitor/doorsignal?token=${encodeURIComponent(token)}`;
}
const checkinInput = z.object({ token: z.string().max(4096), name: z.string().trim().min(1).max(80), kind, consent: z.literal(true) }).strict();
export async function submitCheckin(store: Store, input: unknown) {
  const value = checkinInput.parse(input);
  const access = await verify<{ siteId: string; expectedId?: string }>(value.token, 'checkin');
  await limit(store, access.siteId, 'checkin', 100);
  const expected = access.expectedId ? await store.get<Expected>(access.siteId, `expected:${access.expectedId}`) : undefined;
  if (access.expectedId && (!expected || Date.parse(expected.data.endsAt) + 3600000 < Date.now())) throw new AppError(410, 'This invitation has expired. Ask your host for a new link.');
  const checkinId = randomUUID(); const secret = randomBytes(24).toString('base64url');
  const now = new Date().toISOString();
  const cases = await listCases(store, access.siteId);
  const candidates = cases.filter(x => !x.checkinId && x.status === 'needs_review' && Math.abs(Date.parse(x.occurredAt) - Date.now()) < 5 * 60000 && (!expected || !x.expectedId || x.expectedId === expected.data.id));
  // Never silently choose between simultaneous arrivals.
  const current = candidates.length === 1 ? candidates[0] : undefined;
  const arrival: Arrival = current ? { ...current } : {
    id: randomUUID(), eventId: checkinId, deviceId: 'front-door', source: 'checkin', occurredAt: now, createdAt: now,
    kind: value.kind, status: 'waiting', title: value.name, owner: expected?.data.host || 'Reception', reason: '', match: 'checkin', scene: unknownScene(), timeline: [],
  };
  arrival.checkinId = checkinId; arrival.kind = expected?.data.kind || value.kind; arrival.title = value.name;
  arrival.owner = expected?.data.host || arrival.owner; arrival.expectedId = expected?.data.id || arrival.expectedId;
  arrival.status = 'waiting'; arrival.match = 'checkin';
  arrival.reason = expected ? 'The visitor used an invitation and provided these check-in details. No facial recognition is used.' : 'The visitor provided these check-in details. A host should confirm the visit.';
  arrival.timeline.push({ at: now, actor: 'Visitor', text: `${value.name} checked in. Waiting for a host response.` });
  const checkin: Checkin = { id: checkinId, caseId: arrival.id, name: value.name, kind: arrival.kind, createdAt: now, statusSecretHash: digest(secret) };
  await store.transact([
    { item: item(access.siteId, caseKey(arrival.id), arrival, current?.version), expectedVersion: current?.version ?? null },
    { item: item(access.siteId, `checkin:${checkinId}`, checkin), expectedVersion: null },
    ...await notificationWrites(store, access.siteId, arrival, checkinId),
  ]);
  return { id: checkinId, token: await sign({ purpose: 'status', siteId: access.siteId, checkinId, secret }, 7200), status: 'waiting', mode: access.siteId.startsWith('judge:') ? 'replay' : 'live' };
}
export async function checkinStatus(store: Store, token: string) {
  const access = await verify<{ siteId: string; checkinId: string; secret: string }>(token, 'status');
  const checkin = await store.get<Checkin>(access.siteId, `checkin:${access.checkinId}`);
  if (!checkin || !equal(checkin.data.statusSecretHash, digest(access.secret))) throw new AppError(404, 'This check-in is no longer available.');
  const arrival = await getCase(store, access.siteId, checkin.data.caseId);
  return { status: arrival.data.status, name: checkin.data.name, updatedAt: arrival.data.timeline.at(-1)?.at,
    message: arrival.data.status === 'acknowledged' ? 'Your host is on the way.' : arrival.data.status === 'resolved' ? 'Your visit is complete. Thank you.' : arrival.data.status === 'received' ? 'Your delivery has been received.' : 'Your check-in is saved. Waiting for your host to respond.' };
}
export async function replay(store: Store, principal: Principal, story: string) {
  if (principal.role !== 'judge') throw new AppError(403, 'Replay is available only in an isolated judge demo.');
  if (!['guest', 'delivery', 'service', 'unmatched'].includes(story)) throw new AppError(400, 'Unknown demo story.');
  await limit(store, principal.siteId, 'replays', 30);
  // Each story uses a different arrival window, so earlier examples cannot become false matches.
  const offset = { guest: 0, delivery: 10, service: 20, unmatched: 30 }[story as 'guest'] || 0;
  const occurred = Date.now() + offset * 60000;
  const names = { guest: ['Maya Chen', 'Alex Morgan', 'GUEST'], delivery: ['Studio supplies', 'Reception', 'DELIVERY'], service: ['Air-conditioning service', 'Jamie Park', 'SERVICE'] } as const;
  let expected: (Expected & { version: number }) | undefined;
  if (story !== 'unmatched') {
    const row = names[story as keyof typeof names];
    expected = await createExpected(store, principal, { name: row[0], host: row[1], kind: row[2], startsAt: new Date(occurred - 60000).toISOString(), endsAt: new Date(occurred + 60000).toISOString(), note: 'Fictional data for this isolated demonstration.' });
  }
  const event: DoorEvent = { id: randomUUID(), requestId: randomUUID(), accountId: 'demo-replay', deviceId: 'demo-front-door', type: story === 'unmatched' ? 'motion_detected' : 'button_press', source: 'demo_replay', occurredAt: new Date(occurred).toISOString(), acceptedAt: new Date().toISOString() };
  const accepted = await acceptEvent(store, principal.siteId, event);
  const arrival = await processEvent(store, principal.siteId, accepted.key);
  return { caseId: arrival?.id, visitorPath: expected ? await checkinLink(principal.siteId, expected.id) : null };
}
export async function deleteSiteData(store: Store, siteId: string) {
  const rows = await store.list(siteId, '');
  for (let start = 0; start < rows.length; start += 80) {
    await store.transact(rows.slice(start, start + 80).filter(x => !x.sk.startsWith('limit:')).map(row => ({ item: row, expectedVersion: row.version, delete: true })));
  }
}
