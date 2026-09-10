import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { FileStore, item, limit } from '../../packages/core/src/store';
import { parseWebhook, RingClient, verifyRingSignature } from '../../packages/core/src/ring';
import { AppError, expectedInput, unknownScene, type Principal, type DoorEvent, type Arrival, type Notification } from '../../packages/core/src/types';
import { acceptEvent, applyAction, caseAction, checkinLink, checkinStatus, createExpected, deleteSiteData, getCase, listCases, processEvent, replay, submitCheckin } from '../../packages/core/src/workflows';
import { authenticate, newDemo, sign, verify } from '../../packages/core/src/auth';
import { handleRequest } from '../../packages/core/src/http';
import { parseScene } from '../../packages/core/src/intelligence';
import { dispatchEmail } from '../../packages/core/src/notifications';

let directory: string, store: FileStore;
const principal: Principal = { siteId: 'judge:11111111-1111-4111-8111-111111111111', subject: 'Judge', role: 'judge', mode: 'replay' };
const event = (): DoorEvent => ({ id: randomUUID(), requestId: randomUUID(), accountId: 'demo', deviceId: 'front', type: 'button_press', source: 'demo_replay', occurredAt: new Date().toISOString(), acceptedAt: new Date().toISOString() });
const fixture = () => ({ meta: { version: '1.1', time: new Date().toISOString(), request_id: randomUUID(), account_id: 'ava1.ring.account.example' }, data: { id: randomUUID(), type: 'button_press', attributes: { source: 'ava1.ring.device.example', source_type: 'devices', timestamp: Date.now() } } });
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'doorsignal-test-')); store = new FileStore(join(directory, 'records.json')); process.env.DOORSIGNAL_CONFIG_FILE = join(directory, 'config.json'); process.env.APP_URL = 'http://localhost:3000'; await writeFile(process.env.DOORSIGNAL_CONFIG_FILE, JSON.stringify({ signingKey: 'unit-test-key-with-at-least-thirty-two-characters', notificationEmail: 'verified@example.com' })); });
afterEach(async () => { vi.useRealTimers(); await rm(directory, { recursive: true, force: true }); });

describe('Ring official v1.1 contract', () => {
  it('verifies raw bytes using X-Signature sha256 and parses account/device attribution', () => {
    const payload = fixture(); const raw = Buffer.from(JSON.stringify(payload, null, 2)); const signature = `sha256=${createHmac('sha256', 'fixture-secret').update(raw).digest('hex')}`;
    expect(verifyRingSignature(raw, signature, 'fixture-secret')).toBe(true);
    expect(verifyRingSignature(Buffer.from(JSON.stringify(payload)), signature, 'fixture-secret')).toBe(false);
    expect(parseWebhook(raw)).toMatchObject({ accountId: payload.meta.account_id, deviceId: payload.data.attributes.source, type: 'button_press' });
  });
  it.each(['', 'sha256=xyz', 'sha256=00', 't=123,v1=abcd', `sha256=${'0'.repeat(64)}`])('rejects malformed or wrong signature %s', signature => expect(verifyRingSignature(Buffer.from('{}'), signature, 'secret')).toBe(false));
  it('rejects the prototype envelope', () => expect(() => parseWebhook(Buffer.from(JSON.stringify({ event_id: 'x', device_id: 'y', event_type: 'button_press' })))).toThrow());
  it('preserves motion as motion', () => { const value = fixture(); value.data.type = 'motion_detected'; expect(parseWebhook(Buffer.from(JSON.stringify(value))).type).toBe('motion_detected'); });
  it('rejects invalid versions and timestamps', () => { const value = fixture(); value.meta.version = '1.0'; expect(() => parseWebhook(Buffer.from(JSON.stringify(value)))).toThrow(); value.meta.version = '1.1'; value.data.attributes.timestamp = Date.now() + 600000; expect(() => parseWebhook(Buffer.from(JSON.stringify(value)))).toThrow(); });
  it('maps JSON:API included resources by both type and id, and preserves offline', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [{ type: 'devices', id: 'camera', attributes: { name: 'Front' }, relationships: { status: { data: { type: 'device-status', id: 'status' } }, capabilities: { data: { type: 'device-capabilities', id: 'caps' } } } }], included: [{ type: 'device-status', id: 'status', attributes: { online: false } }, { type: 'device-capabilities', id: 'caps', attributes: { video: { codecs: ['AVC'] } } }] }));
    const devices = await new RingClient('token', Date.now()+60000, fetcher).devices(); expect(devices[0].status).toBe('offline');
    expect(fetcher.mock.calls[0][0].href).toBe('https://api.amazonvision.com/v1/devices?include=status,capabilities');
  });
  it('stops expired tokens before making a request', async () => { const fetcher = vi.fn(); await expect(new RingClient('expired', Date.now()-1, fetcher).devices()).rejects.toMatchObject({ status: 401 }); expect(fetcher).not.toHaveBeenCalled(); });
  it('reports rejected credentials as reconnect, and does not retry them', async () => { const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 401 })); await expect(new RingClient('token', Date.now()+60000, fetcher).devices()).rejects.toMatchObject({ status: 401 }); expect(fetcher).toHaveBeenCalledTimes(1); });
  it('imports documented history metadata and skips other devices and on-demand events', async () => {
    const row = (type: string, device = 'camera') => ({ type: 'history-events', id: randomUUID(), attributes: { event_type: type, start: Date.now(), end: Date.now()+100 }, relationships: { source: { data: { type: 'devices', id: device } } } });
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [row('ding'),row('motion.human'),row('on_demand'),row('ding','other')] }));
    expect((await new RingClient('token', Date.now()+60000, fetcher).history('camera','account')).map(x => x.type)).toEqual(['button_press','motion_detected']);
    expect(fetcher.mock.calls[0][0].pathname).toBe('/v1/history/devices/camera/events');
  });
  it('creates and deletes an actual WHEP session path', async () => {
    const location = 'https://api.amazonvision.com/v1/devices/camera/media/streaming/whep/sessions/session123';
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('v=0\r\na=sendonly\r\n', { status: 201, headers: { Location: location } })).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new RingClient('token', Date.now()+60000, fetcher); const result = await client.startStream('camera', 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=recvonly\r\n'); await client.closeStream('camera', result.location);
    expect(fetcher.mock.calls[1][1].method).toBe('DELETE'); expect(fetcher.mock.calls[1][0].href).toBe(location);
  });
  it('rejects stream cleanup URLs outside the authorized device', async () => { const fetcher = vi.fn(); const client = new RingClient('token',Date.now()+60000,fetcher); await expect(client.closeStream('camera','https://evil.example/v1/stolen')).rejects.toThrow(); await expect(client.closeStream('camera','https://api.amazonvision.com/v1/devices/other/media/streaming/whep/sessions/s')).rejects.toThrow(); expect(fetcher).not.toHaveBeenCalled(); });
});

describe('durable storage and bounded processing', () => {
  it('survives a new store instance and isolates sites', async () => { await store.transact([{ item: item('a','case:1',{ message:'saved' }), expectedVersion:null }]); const restarted = new FileStore(store.filename); expect((await restarted.get<{message:string}>('a','case:1'))?.data.message).toBe('saved'); expect(await restarted.get('b','case:1')).toBeUndefined(); });
  it('atomically rejects the whole transaction on a version conflict', async () => { await store.transact([{ item:item('a','one',{}), expectedVersion:null }]); await expect(store.transact([{ item:item('a','two',{}), expectedVersion:null },{ item:item('a','one',{},5),expectedVersion:5 }])).rejects.toMatchObject({status:409}); expect(await store.get('a','two')).toBeUndefined(); });
  it('allows one of two concurrent updates across independent stores', async () => { const initial=item('a','one',{count:0}); await store.transact([{item:initial,expectedVersion:null}]); const other=new FileStore(store.filename); const results=await Promise.allSettled([store.transact([{item:item('a','one',{count:1},1),expectedVersion:1}]),other.transact([{item:item('a','one',{count:2},1),expectedVersion:1}])]); expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1); });
  it('hides expired records and permits a new TTL bucket', async () => { const expired={...item('a','old',{}),expiresAt:Math.floor(Date.now()/1000)-1}; await store.transact([{item:expired,expectedVersion:null}]); expect(await store.get('a','old')).toBeUndefined(); });
  it('enforces persisted usage allowances under concurrency', async () => { const results=await Promise.allSettled(Array.from({length:5},()=>limit(store,'budget','test',3))); expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(3); });
  it('deduplicates an event with a different delivery request id', async () => { const value=event(); const accepted=await acceptEvent(store,principal.siteId,value); const second=await acceptEvent(store,principal.siteId,{...value,requestId:randomUUID()}); expect(accepted.duplicate).toBe(false); expect(second.duplicate).toBe(true); await processEvent(store,principal.siteId,accepted.key); await processEvent(store,principal.siteId,accepted.key); expect(await listCases(store,principal.siteId)).toHaveLength(1); });
  it('persists acceptance separately so a restarted worker can process it', async () => { const accepted=await acceptEvent(store,principal.siteId,event()); expect(await listCases(store,principal.siteId)).toHaveLength(0); await processEvent(new FileStore(store.filename),principal.siteId,accepted.key); expect(await listCases(store,principal.siteId)).toHaveLength(1); });
  it('rejects unknown live account/device attribution', async () => { await expect(acceptEvent(store,'site:doorsignal',{...event(),source:'ring_webhook'})).rejects.toMatchObject({status:403}); });
  it('deletes only the selected site data', async () => { await store.transact([{item:item('a','case:1',{}),expectedVersion:null},{item:item('b','case:1',{}),expectedVersion:null}]); await deleteSiteData(store,'a'); expect(await store.get('a','case:1')).toBeUndefined(); expect(await store.get('b','case:1')).toBeDefined(); });
});

describe('the three demonstration stories', () => {
  it('guest: tentative arrival to invitation check-in to host acknowledgment visible on phone', async () => {
    const result=await replay(store,principal,'guest'); const arrival=(await getCase(store,principal.siteId,result.caseId!)); expect(arrival.data.match).toBe('tentative');
    const token=new URL(result.visitorPath!,'https://doorsignal.site').searchParams.get('token')!;
    const checked=await submitCheckin(store,{token,name:'Maya Chen',kind:'GUEST',consent:true});
    const linked=await getCase(store,principal.siteId,result.caseId!); expect(linked.data.match).toBe('checkin');
    expect((await checkinStatus(store,checked.token)).status).toBe('waiting');
    await caseAction(store,principal,linked.data.id,{action:'ACKNOWLEDGE',version:linked.version});
    expect((await checkinStatus(new FileStore(store.filename),checked.token)).message).toBe('Your host is on the way.');
  });
  it('delivery: received remains open until collected', async () => { const result=await replay(store,principal,'delivery'); let arrival=await getCase(store,principal.siteId,result.caseId!); const received=await caseAction(store,principal,arrival.data.id,{action:'RECEIVED',version:arrival.version}); expect(received.status).toBe('received'); const collected=await caseAction(store,principal,arrival.data.id,{action:'COLLECTED',version:received.version}); expect(collected.status).toBe('resolved'); });
  it('service: scheduled context still needs confirmation; unmatched requires human review', async () => { const service=await replay(store,principal,'service'); const candidate=await getCase(store,principal.siteId,service.caseId!); expect(candidate.data.kind).toBe('SERVICE'); expect(candidate.data.status).toBe('needs_review'); const confirmed=await caseAction(store,principal,candidate.data.id,{action:'CONFIRM',version:candidate.version}); expect(confirmed.match).toBe('human'); const unmatched=await replay(store,principal,'unmatched'); expect((await getCase(store,principal.siteId,unmatched.caseId!)).data).toMatchObject({kind:'UNMATCHED',status:'needs_review',match:'unknown'}); });
  it('does not choose an identity when expected arrival windows overlap', async () => { await replay(store,principal,'guest'); await createExpected(store,principal,{name:'Another guest',host:'Host',kind:'GUEST',startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+60000).toISOString(),note:''}); const accepted=await acceptEvent(store,principal.siteId,event()); const arrival=await processEvent(store,principal.siteId,accepted.key); expect(arrival?.match).toBe('unknown'); });
  it('does not silently merge a check-in into two simultaneous arrivals', async () => { for(let i=0;i<2;i++){ const accepted=await acceptEvent(store,principal.siteId,event()); await processEvent(store,principal.siteId,accepted.key); } const token=new URL(await checkinLink(principal.siteId),'https://doorsignal.site').searchParams.get('token'); await submitCheckin(store,{token,name:'Visitor',kind:'GUEST',consent:true}); expect(await listCases(store,principal.siteId)).toHaveLength(3); });
  it('rejects expired check-in tokens', async () => { const token=await sign({purpose:'checkin',siteId:principal.siteId},-1); await expect(submitCheckin(store,{token,name:'Visitor',kind:'GUEST',consent:true})).rejects.toMatchObject({status:401}); });
  it('requires consent and valid input', async () => { expect(()=>expectedInput.parse({name:'x',host:'h',kind:'GUEST',startsAt:'bad',endsAt:'bad'})).toThrow(); await expect(submitCheckin(store,{name:'Visitor',kind:'GUEST',consent:false})).rejects.toThrow(); });
  it('rejects collection before receipt and repeated terminal actions', async () => { const result=await replay(store,principal,'delivery'); const row=await getCase(store,principal.siteId,result.caseId!); await expect(caseAction(store,principal,row.data.id,{action:'COLLECTED',version:row.version})).rejects.toMatchObject({status:409}); const closed=await caseAction(store,principal,row.data.id,{action:'DISMISS',version:row.version}); await expect(caseAction(store,principal,row.data.id,{action:'ACKNOWLEDGE',version:closed.version})).rejects.toMatchObject({status:409}); });
  it('rejects concurrent host actions using the same version', async () => { const result=await replay(store,principal,'guest'); const row=await getCase(store,principal.siteId,result.caseId!); const results=await Promise.allSettled(['ACKNOWLEDGE','DISMISS'].map(action=>caseAction(store,principal,row.data.id,{action,version:row.version}))); expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1); });
});

describe('access, model outputs, and failure truthfulness', () => {
  it('rejects unsigned access to case APIs', async () => { expect((await handleRequest(new Request('http://localhost:3000/api/cases'),store)).status).toBe(401); });
  it('rejects cross-origin state changes', async () => { const demo=await newDemo(); const response=await handleRequest(new Request('http://localhost:3000/api/simulate',{method:'POST',headers:{cookie:`ds_demo=${demo.token}`,origin:'https://attacker.example'},body:JSON.stringify({story:'guest'})}),store); expect(response.status).toBe(403); });
  it('does not expose Ring connection controls to judges', async () => { const demo=await newDemo(); const response=await handleRequest(new Request('http://localhost:3000/api/ring/devices',{headers:{cookie:`ds_demo=${demo.token}`}}),store); expect(response.status).toBe(403); });
  it('rejects altered signed tokens and wrong purposes', async () => { const token=await sign({purpose:'status'},60); await expect(verify(token+'x','status')).rejects.toThrow(); await expect(verify(token,'checkin')).rejects.toThrow(); });
  it('represents invalid and uncertain vision as unknown, never invented detections', () => { expect(parseScene('not-json')).toMatchObject({status:'unknown',personPresent:null,packagePresent:null}); expect(parseScene('{"personPresent":true,"packagePresent":false,"vehiclePresent":null,"identity":"Maya"}').status).toBe('unknown'); expect(parseScene('{"personPresent":null,"packagePresent":false,"vehiclePresent":null}').personPresent).toBeNull(); });
  it('does not dispatch email from the judge namespace', async () => { const send=vi.fn(); await expect(dispatchEmail(store,principal.siteId,'notification:x',send)).rejects.toMatchObject({status:403}); expect(send).not.toHaveBeenCalled(); });
  it('records failed SES acceptance and succeeds on a bounded retry', async () => { process.env.SES_FROM='sender@example.com'; const notification:Notification={id:'n1',caseId:'c1',channel:'email',title:'Arrival',state:'queued',attempts:0,createdAt:new Date().toISOString()}; await store.transact([{item:item('site:doorsignal','notification:n1',notification),expectedVersion:null}]); const fail=vi.fn().mockRejectedValue(new Error('service unavailable')); await expect(dispatchEmail(store,'site:doorsignal','notification:n1',fail)).rejects.toThrow(); expect((await store.get<Notification>('site:doorsignal','notification:n1'))?.data.state).toBe('failed'); const ok=vi.fn().mockResolvedValue({MessageId:'ses-accepted'}); await dispatchEmail(store,'site:doorsignal','notification:n1',ok); await dispatchEmail(store,'site:doorsignal','notification:n1',ok); expect(ok).toHaveBeenCalledTimes(1); expect((await store.get<Notification>('site:doorsignal','notification:n1'))?.data).toMatchObject({state:'sent',attempts:2,messageId:'ses-accepted'}); });
});
