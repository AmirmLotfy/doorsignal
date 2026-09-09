export const EventTopics = {
  DOOR_MOTION_DETECTED: 'door.motion_detected',
  DOOR_BUTTON_PRESSED: 'door.button_pressed',
  DOOR_PACKAGE_DETECTED: 'door.package_detected',
  DOOR_MEDIA_AVAILABLE: 'door.media_available',
  ARRIVAL_EXPECTED_CREATED: 'arrival.expected.created',
  ARRIVAL_CHECKIN_CREATED: 'arrival.checkin.created',
  CASE_CREATED: 'case.created',
  CASE_CONTEXTUALIZED: 'case.contextualized',
  CASE_MATCHED: 'case.matched',
  CASE_UNMATCHED: 'case.unmatched',
  CASE_ROUTED: 'case.routed',
  CASE_ACKNOWLEDGED: 'case.acknowledged',
  CASE_RESOLVED: 'case.resolved',
  DELIVERY_EXPECTED: 'delivery.expected',
  DELIVERY_RECEIVED: 'delivery.received',
  DELIVERY_COLLECTED: 'delivery.collected',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed'
} as const;

export type EventTopic = typeof EventTopics[keyof typeof EventTopics];

export interface DomainEvent<T = unknown> {
  id: string;
  topic: EventTopic;
  source: string;
  timestamp: string;
  data: T;
}
