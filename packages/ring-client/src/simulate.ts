import { createSimulatedRingEvent } from './playground.js';

async function runCliSimulation() {
  const scenario = process.argv[2] || 'A';
  const targetUrl = process.env.WEBHOOK_TARGET_URL || 'http://localhost:3000/api/webhooks/ring';

  console.log(`\n🔔 Running DoorSignal Ring Simulation: Scenario ${scenario}`);
  console.log(`🎯 Target Webhook URL: ${targetUrl}`);

  let eventType: 'button_press' | 'motion_detected' | 'package_detected' = 'button_press';
  let deviceId = 'ring_dev_front_door_01';
  let extraData: Record<string, unknown> = {};

  if (scenario === 'A') {
    console.log('📌 Scenario A: Expected Guest (10:30 Interview with Maya Patel)');
    eventType = 'button_press';
    deviceId = 'ring_dev_front_door_01';
  } else if (scenario === 'B') {
    console.log('📌 Scenario B: Package Arrival (Office Supplies - FedEx)');
    eventType = 'package_detected';
    deviceId = 'ring_dev_dock_02';
    extraData = { carrier: 'FedEx', box_count: 2 };
  } else if (scenario === 'C') {
    console.log('📌 Scenario C: After-Hours Arrival (AC Maintenance or Unmatched)');
    eventType = 'button_press';
    deviceId = 'ring_dev_front_door_01';
  } else {
    console.log(`Unknown scenario: ${scenario}. Defaulting to button press.`);
  }

  const { payload, rawBody, headers } = createSimulatedRingEvent({
    deviceId,
    eventType,
    data: extraData
  });

  console.log('\n📦 Generated Webhook Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n🔑 Signature Headers:');
  console.log(headers);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: rawBody
    });

    console.log(`\n📡 HTTP Status: ${res.status} ${res.statusText}`);
    const responseJson = await res.json().catch(() => null);
    if (responseJson) {
      console.log('📄 Response Body:', JSON.stringify(responseJson, null, 2));
    }
  } catch (err) {
    console.warn('\n⚠️ Could not send HTTP request (server might not be running locally). Payload printed above for manual piping.');
  }
}

if (process.argv[1]?.endsWith('simulate.ts')) {
  runCliSimulation();
}
