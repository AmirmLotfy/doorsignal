import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { AppError, type Notification } from './types';
import { config } from './secrets';
import { item, limit, type Store } from './store';

const ses = new SESv2Client({ region: process.env.AWS_REGION || 'us-east-1', maxAttempts: 1 });
export async function dispatchEmail(store: Store, siteId: string, key: string, send: (message: SendEmailCommand) => Promise<{ MessageId?: string }> = command => ses.send(command)) {
  if (siteId.startsWith('judge:')) throw new AppError(403, 'Judge demo cannot send email.');
  const record = await store.get<Notification>(siteId, key);
  if (!record || record.data.channel !== 'email' || record.data.state === 'sent') return;
  if (record.data.state === 'sending' && (record.data.leaseUntil || 0) > Date.now()) throw new Error('Notification delivery is already in progress.');
  if (record.data.attempts >= 3) throw new Error('Notification retry limit reached. Inspect the dead-letter queue.');
  const value = await config();
  if (!value.notificationEmail || !process.env.SES_FROM) throw new Error('SES sender and approved recipient must be configured.');
  await limit(store, 'budget', 'email-daily', 30);
  const sending: Notification = { ...record.data, state: 'sending', attempts: record.data.attempts + 1, leaseUntil: Date.now() + 30000 };
  await store.transact([{ item: item(siteId, key, sending, record.version), expectedVersion: record.version }]);
  let result: { MessageId?: string };
  try {
    result = await send(new SendEmailCommand({ FromEmailAddress: process.env.SES_FROM,
      Destination: { ToAddresses: [value.notificationEmail] },
      Content: { Simple: {
        Subject: { Data: 'DoorSignal: an arrival needs your attention', Charset: 'UTF-8' },
        Body: { Text: { Charset: 'UTF-8', Data: `An arrival is waiting for a host at DoorSignal.\n\nOpen the arrival to review it and choose an action:\n${process.env.APP_URL}/today?case=${encodeURIComponent(record.data.caseId)}\n\nOpening this link does not acknowledge or resolve the arrival. Operator sign-in is required.\n\nNo camera image is attached.` } },
      } },
    }));
  } catch {
    await store.transact([{ item: item(siteId, key, { ...sending, state: 'failed', error: 'SES did not accept this request. Delivery will be retried within the configured limit.', leaseUntil: 0 }, record.version + 1), expectedVersion: record.version + 1 }]);
    throw new Error('SES delivery failed.');
  }
  // SES acceptance is not proof of inbox delivery. That distinction is retained in the UI and docs.
  await store.transact([{ item: item(siteId, key, { ...sending, state: 'sent', messageId: result.MessageId, error: undefined, leaseUntil: 0 }, record.version + 1), expectedVersion: record.version + 1 }]);
}
