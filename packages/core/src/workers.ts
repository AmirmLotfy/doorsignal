import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { DynamoDBStreamEvent, EventBridgeEvent } from 'aws-lambda';
import { getStore } from './store';
import { processEvent } from './workflows';
import { dispatchEmail } from './notifications';
import type { Notification, RecordItem } from './types';

const bus = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1', maxAttempts: 2 });
export async function forwardStream(event: DynamoDBStreamEvent) {
  const failures: { itemIdentifier: string }[] = [];
  for (const record of event.Records) {
    if (record.eventName !== 'INSERT' || !record.dynamodb?.NewImage) continue;
    const row = unmarshall(record.dynamodb.NewImage as Parameters<typeof unmarshall>[0]) as RecordItem;
    if (row.pk.startsWith('judge:')) continue;
    const type = row.sk.startsWith('event:') ? 'RingEventAccepted' : row.sk.startsWith('notification:') && (row.data as Notification).channel === 'email' && (row.data as Notification).state === 'queued' ? 'EmailQueued' : null;
    if (!type) continue;
    try {
      const result = await bus.send(new PutEventsCommand({ Entries: [{ EventBusName: process.env.EVENT_BUS_NAME, Source: 'doorsignal', DetailType: type, Detail: JSON.stringify({ siteId: row.pk, key: row.sk }) }] }));
      if (result.FailedEntryCount) throw new Error('EventBridge rejected an entry.');
    } catch { failures.push({ itemIdentifier: record.dynamodb.SequenceNumber! }); }
  }
  return { batchItemFailures: failures };
}
export async function processWork(event: EventBridgeEvent<string, { siteId: string; key: string }>) {
  if (event.source !== 'doorsignal' || event.detail.siteId !== 'site:doorsignal') throw new Error('Invalid worker scope.');
  if (event['detail-type'] === 'RingEventAccepted' && event.detail.key.startsWith('event:')) return processEvent(getStore(), event.detail.siteId, event.detail.key);
  if (event['detail-type'] === 'EmailQueued' && event.detail.key.startsWith('notification:')) return dispatchEmail(getStore(), event.detail.siteId, event.detail.key);
  throw new Error('Unknown work type.');
}
