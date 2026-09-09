export interface WhepSessionConfig {
  deviceId: string;
  whepEndpoint: string;
  authToken: string;
  isBatteryDevice: boolean;
  maxSessionSeconds: number; // 30 for battery, 60 for wired
  watermark: {
    appId: string;
    appName: string;
    deviceId: string;
    timestamp: string;
  };
}

export function createWhepSessionMetadata(
  deviceId: string,
  isBatteryDevice: boolean = false
): WhepSessionConfig {
  const maxSeconds = isBatteryDevice ? 30 : 60;
  return {
    deviceId,
    whepEndpoint: `https://api.ring.com/v1/devices/${deviceId}/live_view/whep`,
    authToken: `whep_token_ephemeral_${Date.now()}`,
    isBatteryDevice,
    maxSessionSeconds: maxSeconds,
    watermark: {
      appId: 'amzn.ring.app.doorsignal',
      appName: 'DoorSignal',
      deviceId,
      timestamp: new Date().toISOString()
    }
  };
}
