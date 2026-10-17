export interface MockEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name: string;
    icon?: string;
    unit_of_measurement?: string;
    brightness?: number;
    current_temperature?: number;
    temperature?: number;
    rgb_color?: [number, number, number];
    [key: string]: any;
  };
  last_changed: string;
  last_updated: string;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export const initialMockEntities: Record<string, MockEntity> = {
  'light.desk_backlight': {
    entity_id: 'light.desk_backlight',
    state: 'on',
    attributes: {
      friendly_name: 'Desk Backlight',
      icon: 'mdi:led-strip-variant',
      brightness: 204,
      rgb_color: [255, 170, 50],
      supported_color_modes: ['rgb', 'brightness'],
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'light.ambient_light': {
    entity_id: 'light.ambient_light',
    state: 'on',
    attributes: {
      friendly_name: 'Ambient Warm Light',
      icon: 'mdi:lamp',
      brightness: 160,
      rgb_color: [255, 190, 110],
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'switch.pc_speakers': {
    entity_id: 'switch.pc_speakers',
    state: 'on',
    attributes: {
      friendly_name: 'Audio Monitors',
      icon: 'mdi:speaker',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'switch.desk_charging': {
    entity_id: 'switch.desk_charging',
    state: 'on',
    attributes: {
      friendly_name: 'Fast Wireless Charger',
      icon: 'mdi:lightning-bolt',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'climate.office_ac': {
    entity_id: 'climate.office_ac',
    state: 'cool',
    attributes: {
      friendly_name: 'Climate Control',
      current_temperature: 22.4,
      temperature: 21.5,
      hvac_action: 'cooling',
      fan_mode: 'auto',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.office_temperature': {
    entity_id: 'sensor.office_temperature',
    state: '22.4',
    attributes: {
      friendly_name: 'Desk Temperature',
      unit_of_measurement: '°C',
      device_class: 'temperature',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.office_humidity': {
    entity_id: 'sensor.office_humidity',
    state: '48.5',
    attributes: {
      friendly_name: 'Room Humidity',
      unit_of_measurement: '%',
      device_class: 'humidity',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.desk_power': {
    entity_id: 'sensor.desk_power',
    state: '342',
    attributes: {
      friendly_name: 'Desk Power Draw',
      unit_of_measurement: 'W',
      device_class: 'power',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.pc_cpu_temp': {
    entity_id: 'sensor.pc_cpu_temp',
    state: '54.8',
    attributes: {
      friendly_name: 'CPU Package Temp',
      unit_of_measurement: '°C',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.pc_gpu_temp': {
    entity_id: 'sensor.pc_gpu_temp',
    state: '61.2',
    attributes: {
      friendly_name: 'GPU Core Temp',
      unit_of_measurement: '°C',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.pc_cpu_usage': {
    entity_id: 'sensor.pc_cpu_usage',
    state: '28',
    attributes: {
      friendly_name: 'CPU Utilization',
      unit_of_measurement: '%',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'sensor.pc_ram_usage': {
    entity_id: 'sensor.pc_ram_usage',
    state: '46',
    attributes: {
      friendly_name: 'RAM Usage',
      unit_of_measurement: '%',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
};

/**
 * Generates synthetic historical time-series data points for Mushroom graphs
 */
export function generateMockTimeSeries(
  baseValue: number,
  variance: number,
  points: number = 24,
  intervalMinutes: number = 5
): MetricPoint[] {
  const result: MetricPoint[] = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalMinutes * 60 * 1000).toISOString();
    // Use harmonic oscillation + random jitter to produce realistic curves
    const wave = Math.sin((points - i) / 3.5) * (variance * 0.6);
    const noise = (Math.random() - 0.5) * (variance * 0.4);
    const val = Number((baseValue + wave + noise).toFixed(1));
    result.push({ time: timestamp, value: Math.max(0, val) });
  }

  return result;
}
