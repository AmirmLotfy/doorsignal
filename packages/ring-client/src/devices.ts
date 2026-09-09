export interface RingDeviceRaw {
  id: string;
  description: string;
  kind: 'doorbell' | 'doorbell_v4' | 'doorbell_portal' | 'stickup_cam' | 'floodlight_cam';
  battery_life?: number;
  firmware_version?: string;
  features: {
    motions?: boolean;
    show_recordings?: boolean;
    live_view?: boolean;
    package_detection?: boolean;
  };
  health: {
    wifi_name?: string;
    battery_percentage?: number;
    last_update?: string;
  };
}

export interface RingDeviceSummary {
  externalId: string;
  displayName: string;
  deviceType: 'DOORBELL' | 'CAMERA' | 'INTERCOM';
  status: 'ONLINE' | 'OFFLINE' | 'SUSPENDED';
  batteryLevel?: number;
  capabilities: {
    liveViewWhep: boolean;
    snapshot: boolean;
    packageDetection: boolean;
  };
}

export function mapRingDeviceToSummary(raw: RingDeviceRaw): RingDeviceSummary {
  const isDoorbell = raw.kind.includes('doorbell') || raw.kind.includes('portal');
  return {
    externalId: raw.id,
    displayName: raw.description || (isDoorbell ? 'Front Doorbell' : 'Door Camera'),
    deviceType: isDoorbell ? 'DOORBELL' : 'CAMERA',
    status: 'ONLINE',
    batteryLevel: raw.health?.battery_percentage ?? raw.battery_life,
    capabilities: {
      liveViewWhep: !!raw.features.live_view,
      snapshot: true,
      packageDetection: !!raw.features.package_detection
    }
  };
}
