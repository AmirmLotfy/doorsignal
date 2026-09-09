import { 
  pgTable, uuid, text, timestamp, boolean, integer, 
  decimal, jsonb, pgEnum, index, uniqueIndex 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- ENUMS ---
export const roleEnum = pgEnum('membership_role', ['OWNER', 'ADMIN', 'HOST', 'OPERATIONS', 'VIEWER']);
export const ringDeviceTypeEnum = pgEnum('ring_device_type', ['DOORBELL', 'CAMERA', 'INTERCOM']);
export const ringDeviceStatusEnum = pgEnum('ring_device_status', ['ONLINE', 'OFFLINE', 'SUSPENDED']);
export const arrivalIntentEnum = pgEnum('arrival_intent', ['GUEST', 'DELIVERY', 'SERVICE', 'PICKUP', 'UNMATCHED']);
export const expectedArrivalStatusEnum = pgEnum('expected_arrival_status', ['PENDING', 'ARRIVED', 'EXPIRED', 'CANCELLED']);
export const doorEventTypeEnum = pgEnum('door_event_type', ['BUTTON_PRESS', 'MOTION_DETECTED', 'PACKAGE_DETECTED']);
export const caseStatusEnum = pgEnum('case_status', [
  'DETECTED', 'CONTEXTUALIZING', 'MATCHED', 'UNMATCHED', 'ROUTED', 'ACKNOWLEDGED', 'RESOLVED'
]);
export const deliveryStatusEnum = pgEnum('delivery_status', ['EXPECTED', 'RECEIVED', 'AWAITING_COLLECTION', 'COLLECTED']);
export const mediaTypeEnum = pgEnum('media_type', ['SNAPSHOT', 'WHEP_SESSION_LOG']);
export const actorTypeEnum = pgEnum('actor_type', ['USER', 'SYSTEM_AGENT', 'EXTERNAL_INTEGRATION']);
export const notificationChannelEnum = pgEnum('notification_channel', ['IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK']);
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED', 'DELIVERED']);
export const integrationProviderEnum = pgEnum('integration_provider', ['GOOGLE_WORKSPACE', 'MICROSOFT_365', 'SLACK']);

// 1. ORGANIZATIONS
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default('America/New_York'),
  retentionPolicy: jsonb('retention_policy').notNull().default({
    mediaRetentionMinutes: 60,
    caseRetentionDays: 90,
    storeSnapshots: false
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 2. USERS
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  cognitoSub: text('cognito_sub').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 3. MEMBERSHIPS
export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: roleEnum('role').notNull().default('HOST'),
  department: text('department'), // e.g. 'Engineering', 'Talent', 'Operations'
  notificationPreferences: jsonb('notification_preferences').notNull().default({
    email: true,
    inApp: true
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  orgUserIdx: uniqueIndex('membership_org_user_idx').on(t.organizationId, t.userId)
}));

// 4. SITES
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // e.g. "Northline Studio"
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default('America/New_York'),
  address: text('address'),
  businessHours: jsonb('business_hours').notNull().default({
    mon_fri: { open: '08:00', close: '18:00' },
    sat_sun: { open: null, close: null }
  }),
  checkinQrToken: text('checkin_qr_token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 5. RING INTEGRATIONS
export const ringIntegrations = pgTable('ring_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  credentialRef: text('credential_ref').notNull(),
  webhookSecretRef: text('webhook_secret_ref').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 6. RING DEVICES
export const ringDevices = pgTable('ring_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }).notNull(),
  ringIntegrationId: uuid('ring_integration_id').references(() => ringIntegrations.id, { onDelete: 'cascade' }).notNull(),
  externalId: text('external_id').notNull(),
  displayName: text('display_name').notNull(), // "Front Entry", "Delivery Dock"
  deviceType: ringDeviceTypeEnum('device_type').notNull().default('DOORBELL'),
  status: ringDeviceStatusEnum('status').notNull().default('ONLINE'),
  capabilities: jsonb('capabilities').notNull().default({
    liveViewWhep: true,
    snapshot: true,
    packageDetection: true
  }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  externalIdIdx: uniqueIndex('ring_devices_external_id_idx').on(t.ringIntegrationId, t.externalId)
}));

// 7. EXPECTED ARRIVALS
export const expectedArrivals = pgTable('expected_arrivals', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }).notNull(),
  hostMembershipId: uuid('host_membership_id').references(() => memberships.id, { onDelete: 'set null' }),
  intent: arrivalIntentEnum('intent').notNull(),
  displayName: text('display_name').notNull(), // "Alex Rivera (Interview with Maya)", "FedEx Office Supplies", "AC Tech"
  contactRef: text('contact_ref'),
  source: text('source').notNull().default('MANUAL'),
  externalEventId: text('external_event_id'),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  checkinToken: text('checkin_token'),
  notes: text('notes'),
  status: expectedArrivalStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  siteTimeIdx: index('expected_arrivals_site_time_idx').on(t.siteId, t.windowStart, t.windowEnd)
}));

// 8. DOOR EVENTS
export const doorEvents = pgTable('door_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  ringDeviceId: uuid('ring_device_id').references(() => ringDevices.id, { onDelete: 'cascade' }).notNull(),
  ringRequestId: text('ring_request_id').notNull().unique(),
  eventType: doorEventTypeEnum('event_type').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  payloadHash: text('payload_hash').notNull(),
  coarseVisionMetadata: jsonb('coarse_vision_metadata'),
  processedAt: timestamp('processed_at', { withTimezone: true })
});

// 9. ARRIVAL CASES
export const arrivalCases = pgTable('arrival_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseNumber: text('case_number').notNull().unique(), // e.g. "DS-1042"
  doorEventId: uuid('door_event_id').references(() => doorEvents.id, { onDelete: 'cascade' }).notNull().unique(),
  expectedArrivalId: uuid('expected_arrival_id').references(() => expectedArrivals.id, { onDelete: 'set null' }),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }).notNull(),
  intent: arrivalIntentEnum('intent').notNull().default('UNMATCHED'),
  status: caseStatusEnum('status').notNull().default('DETECTED'),
  matchReason: text('match_reason'),
  confidenceInternal: decimal('confidence_internal', { precision: 3, scale: 2 }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  siteStatusIdx: index('arrival_cases_site_status_idx').on(t.siteId, t.status, t.createdAt)
}));

// 10. CASE CANDIDATES
export const caseCandidates = pgTable('case_candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  arrivalCaseId: uuid('arrival_case_id').references(() => arrivalCases.id, { onDelete: 'cascade' }).notNull(),
  expectedArrivalId: uuid('expected_arrival_id').references(() => expectedArrivals.id, { onDelete: 'cascade' }).notNull(),
  internalScore: decimal('internal_score', { precision: 3, scale: 2 }).notNull(),
  evidence: jsonb('evidence').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 11. CHECKINS
export const checkins = pgTable('checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }).notNull(),
  arrivalCaseId: uuid('arrival_case_id').references(() => arrivalCases.id, { onDelete: 'set null' }),
  expectedArrivalId: uuid('expected_arrival_id').references(() => expectedArrivals.id, { onDelete: 'set null' }),
  publicTokenHash: text('public_token_hash'),
  intent: arrivalIntentEnum('intent').notNull(),
  visitorName: text('visitor_name'),
  hostNameSearched: text('host_name_searched'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  siteCreatedIdx: index('checkins_site_created_idx').on(t.siteId, t.createdAt)
}));

// 12. DELIVERIES
export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  arrivalCaseId: uuid('arrival_case_id').references(() => arrivalCases.id, { onDelete: 'set null' }),
  expectedArrivalId: uuid('expected_arrival_id').references(() => expectedArrivals.id, { onDelete: 'set null' }),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }).notNull(),
  carrier: text('carrier').notNull(),
  trackingSuffix: text('tracking_suffix'),
  description: text('description').notNull(),
  status: deliveryStatusEnum('status').notNull().default('EXPECTED'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  collectedAt: timestamp('collected_at', { withTimezone: true }),
  collectedByUserId: uuid('collected_by_user_id').references(() => users.id, { onDelete: 'set null' })
});

// 13. MEDIA ARTIFACTS
export const mediaArtifacts = pgTable('media_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  doorEventId: uuid('door_event_id').references(() => doorEvents.id, { onDelete: 'cascade' }).notNull(),
  mediaType: mediaTypeEnum('media_type').notNull(),
  encryptedObjectRef: text('encrypted_object_ref').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (t) => ({
  expiresAtIdx: index('media_artifacts_expires_at_idx').on(t.expiresAt)
}));

// 14. CASE ACTIONS
export const caseActions = pgTable('case_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  arrivalCaseId: uuid('arrival_case_id').references(() => arrivalCases.id, { onDelete: 'cascade' }).notNull(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: text('actor_id').notNull(),
  actionType: text('action_type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 15. NOTIFICATIONS
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  arrivalCaseId: uuid('arrival_case_id').references(() => arrivalCases.id, { onDelete: 'cascade' }).notNull(),
  channel: notificationChannelEnum('channel').notNull(),
  recipientRef: text('recipient_ref').notNull(),
  subject: text('subject').notNull(),
  bodyContent: text('body_content').notNull(),
  status: notificationStatusEnum('status').notNull().default('PENDING'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  error: text('error')
});

// 16. BUSINESS INTEGRATIONS
export const businessIntegrations = pgTable('business_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  provider: integrationProviderEnum('provider').notNull(),
  credentialRef: text('credential_ref').notNull(),
  status: text('status').notNull().default('CONNECTED'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 17. WORKFLOWS & WORKFLOW STEPS
export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  actionType: text('action_type').notNull(),
  configuration: jsonb('configuration').notNull()
});

// 18. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// --- RELATIONS ---
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  sites: many(sites),
  ringIntegrations: many(ringIntegrations),
  businessIntegrations: many(businessIntegrations),
  workflows: many(workflows),
  auditLogs: many(auditLogs)
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, { fields: [sites.organizationId], references: [organizations.id] }),
  ringDevices: many(ringDevices),
  expectedArrivals: many(expectedArrivals),
  arrivalCases: many(arrivalCases),
  checkins: many(checkins),
  deliveries: many(deliveries)
}));

export const arrivalCasesRelations = relations(arrivalCases, ({ one, many }) => ({
  doorEvent: one(doorEvents, { fields: [arrivalCases.doorEventId], references: [doorEvents.id] }),
  expectedArrival: one(expectedArrivals, { fields: [arrivalCases.expectedArrivalId], references: [expectedArrivals.id] }),
  site: one(sites, { fields: [arrivalCases.siteId], references: [sites.id] }),
  candidates: many(caseCandidates),
  actions: many(caseActions),
  notifications: many(notifications)
}));
