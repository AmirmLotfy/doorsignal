import { DoorCardData, formatOperationalEmail } from './templates.js';
import { eventBus, EventTopics } from '@doorsignal/events';

export interface DispatchNotificationParams {
  caseId: string;
  recipientEmail: string;
  cardData: DoorCardData;
}

export async function dispatchNotification({
  caseId,
  recipientEmail,
  cardData
}: DispatchNotificationParams): Promise<{ status: string; channel: string }> {
  const email = formatOperationalEmail(cardData);

  // Simulation: Logs SES dispatch and emits notification.sent event
  console.log(`📨 [SES Dispatch] To: ${recipientEmail} | Subject: ${email.subject}`);

  await eventBus.publish(EventTopics.NOTIFICATION_SENT, {
    caseId,
    recipient: recipientEmail,
    channel: 'EMAIL',
    subject: email.subject
  });

  return { status: 'SENT', channel: 'EMAIL' };
}
