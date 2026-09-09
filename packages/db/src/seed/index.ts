import { db } from '../client.js';
import * as s from '../schema.js';

export async function seedDemoData() {
  console.log('🌱 Seeding DoorSignal demo dataset for Northline Studio...');

  // 1. Create Organization
  const [org] = await db.insert(s.organizations).values({
    name: 'Northline Studio',
    slug: 'northline',
    timezone: 'America/New_York',
    retentionPolicy: {
      mediaRetentionMinutes: 60,
      caseRetentionDays: 90,
      storeSnapshots: false
    }
  }).onConflictDoNothing().returning();

  const orgId = org ? org.id : 'b1b017f8-7b98-4c31-9f2d-96e001ba9000';

  // 2. Create Users
  const [maya] = await db.insert(s.users).values({
    cognitoSub: 'cognito_maya_patel',
    email: 'maya@northline.studio',
    displayName: 'Maya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces'
  }).onConflictDoNothing().returning();

  const [sarah] = await db.insert(s.users).values({
    cognitoSub: 'cognito_sarah_chen',
    email: 'sarah@northline.studio',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces'
  }).onConflictDoNothing().returning();

  const [oliver] = await db.insert(s.users).values({
    cognitoSub: 'cognito_oliver_vance',
    email: 'oliver@northline.studio',
    displayName: 'Oliver Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces'
  }).onConflictDoNothing().returning();

  // 3. Create Site
  const [site] = await db.insert(s.sites).values({
    organizationId: orgId,
    name: 'Northline Studio',
    slug: 'northline-studio',
    address: '32 Mercer Street, New York, NY 10013',
    timezone: 'America/New_York',
    checkinQrToken: 'qr_northline_mercer_32',
    businessHours: {
      mon_fri: { open: '08:30', close: '18:30' },
      sat_sun: { open: null, close: null }
    }
  }).onConflictDoNothing().returning();

  const siteId = site ? site.id : 'b1b017f8-7b98-4c31-9f2d-96e001ba9001';

  // 4. Create Ring Integration & Devices
  const [ringIntegration] = await db.insert(s.ringIntegrations).values({
    organizationId: orgId,
    credentialRef: 'secrets/ring/northline',
    webhookSecretRef: 'secrets/ring/webhook/northline',
    status: 'ACTIVE'
  }).onConflictDoNothing().returning();

  const ringIntId = ringIntegration ? ringIntegration.id : 'b1b017f8-7b98-4c31-9f2d-96e001ba9002';

  const [frontDoor] = await db.insert(s.ringDevices).values({
    siteId,
    ringIntegrationId: ringIntId,
    externalId: 'ring_dev_front_door_01',
    displayName: 'Front Entry',
    deviceType: 'DOORBELL',
    status: 'ONLINE',
    capabilities: {
      liveViewWhep: true,
      snapshot: true,
      packageDetection: true
    },
    lastSeenAt: new Date()
  }).onConflictDoNothing().returning();

  const [deliveryDock] = await db.insert(s.ringDevices).values({
    siteId,
    ringIntegrationId: ringIntId,
    externalId: 'ring_dev_dock_02',
    displayName: 'Delivery Entrance',
    deviceType: 'CAMERA',
    status: 'ONLINE',
    capabilities: {
      liveViewWhep: true,
      snapshot: true,
      packageDetection: true
    },
    lastSeenAt: new Date()
  }).onConflictDoNothing().returning();

  // 5. Seed Expected Arrivals for Scenarios A, B, and C
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  // Scenario A: Maya's 10:30 Interview
  await db.insert(s.expectedArrivals).values({
    siteId,
    intent: 'GUEST',
    displayName: 'Candidate Interview · Alex Rivera',
    contactRef: 'alex.rivera@example.com',
    source: 'GOOGLE_CALENDAR',
    externalEventId: 'gcal_interview_1030',
    windowStart: new Date(y, m, d, 10, 15),
    windowEnd: new Date(y, m, d, 11, 15),
    checkinToken: 'TOK-ALEX-1030',
    notes: 'Senior Product Designer role interview with Maya Patel',
    status: 'PENDING'
  }).onConflictDoNothing();

  // Scenario B: FedEx Office Supplies
  await db.insert(s.expectedArrivals).values({
    siteId,
    intent: 'DELIVERY',
    displayName: 'Office Supplies · FedEx',
    contactRef: 'tracking: 748901283921',
    source: 'MANUAL',
    windowStart: new Date(y, m, d, 9, 0),
    windowEnd: new Date(y, m, d, 17, 0),
    notes: 'Restock paper, toner, and pantry items. Ring Delivery Entrance.',
    status: 'PENDING'
  }).onConflictDoNothing();

  // Scenario C: AC Maintenance Service
  await db.insert(s.expectedArrivals).values({
    siteId,
    intent: 'SERVICE',
    displayName: 'AC Maintenance · HVAC Pro',
    contactRef: 'dispatch@hvacpro.com',
    source: 'MANUAL',
    windowStart: new Date(y, m, d, 19, 30),
    windowEnd: new Date(y, m, d, 20, 30),
    notes: 'Scheduled after-hours roof compressor quarterly service',
    status: 'PENDING'
  }).onConflictDoNothing();

  // Courier Pickup
  await db.insert(s.expectedArrivals).values({
    siteId,
    intent: 'PICKUP',
    displayName: 'Courier Pickup · Architectural Models',
    contactRef: 'dispatch@quickcourier.nyc',
    source: 'MANUAL',
    windowStart: new Date(y, m, d, 12, 0),
    windowEnd: new Date(y, m, d, 13, 0),
    notes: 'Package ready at reception for client presentation',
    status: 'PENDING'
  }).onConflictDoNothing();

  console.log('✅ Demo dataset successfully populated for Northline Studio.');
}

if (process.argv[1]?.endsWith('seed/index.ts')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed demo data:', err);
      process.exit(1);
    });
}
