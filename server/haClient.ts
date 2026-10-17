import { initialMockEntities, MockEntity } from './mockData';

export class HomeAssistantClient {
  private url: string;
  private token: string;
  private isConfigured: boolean;
  private inMemoryStates: Map<string, MockEntity>;

  constructor() {
    this.url = (process.env.HA_URL || 'http://homeassistant.local:8123').replace(/\/$/, '');
    this.token = process.env.HA_TOKEN || '';
    this.isConfigured = Boolean(this.token && this.token.trim().length > 10);
    this.inMemoryStates = new Map();

    // Populate mock entities
    for (const [id, entity] of Object.entries(initialMockEntities)) {
      this.inMemoryStates.set(id, { ...entity });
    }

    // Periodically produce tiny fluctuations in mock sensors for dynamic realism
    if (!this.isConfigured) {
      setInterval(() => {
        this.fluctuateMockSensors();
      }, 3500);
    }
  }

  private fluctuateMockSensors() {
    const power = this.inMemoryStates.get('sensor.desk_power');
    if (power) {
      const current = parseFloat(power.state) || 340;
      const delta = (Math.random() - 0.5) * 12;
      power.state = Math.max(120, Math.round(current + delta)).toString();
      power.last_updated = new Date().toISOString();
    }

    const cpu = this.inMemoryStates.get('sensor.pc_cpu_temp');
    if (cpu) {
      const current = parseFloat(cpu.state) || 54;
      const delta = (Math.random() - 0.48) * 1.5;
      cpu.state = (Math.max(40, Math.min(85, current + delta))).toFixed(1);
      cpu.last_updated = new Date().toISOString();
    }

    const gpu = this.inMemoryStates.get('sensor.pc_gpu_temp');
    if (gpu) {
      const current = parseFloat(gpu.state) || 61;
      const delta = (Math.random() - 0.48) * 1.2;
      gpu.state = (Math.max(45, Math.min(88, current + delta))).toFixed(1);
      gpu.last_updated = new Date().toISOString();
    }

    const load = this.inMemoryStates.get('sensor.pc_cpu_usage');
    if (load) {
      const current = parseFloat(load.state) || 28;
      const delta = (Math.random() - 0.5) * 6;
      load.state = Math.max(5, Math.min(99, Math.round(current + delta))).toString();
      load.last_updated = new Date().toISOString();
    }
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      url: this.url,
      mode: this.isConfigured ? 'live' : 'simulation',
    };
  }

  public async getAllStates(): Promise<any[]> {
    if (!this.isConfigured) {
      return Array.from(this.inMemoryStates.values());
    }

    try {
      const res = await fetch(`${this.url}/api/states`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`[HA Client] Failed to fetch states (${res.status}): fallback to simulation`);
        return Array.from(this.inMemoryStates.values());
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`[HA Client] Error connecting to ${this.url}: ${err.message}. Using simulation.`);
      return Array.from(this.inMemoryStates.values());
    }
  }

  public async getState(entityId: string): Promise<any> {
    if (!this.isConfigured) {
      return this.inMemoryStates.get(entityId) || null;
    }

    try {
      const res = await fetch(`${this.url}/api/states/${entityId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return this.inMemoryStates.get(entityId) || null;
      }

      return await res.json();
    } catch {
      return this.inMemoryStates.get(entityId) || null;
    }
  }

  public async callService(domain: string, service: string, serviceData: any = {}): Promise<any> {
    if (!this.isConfigured) {
      return this.handleMockServiceCall(domain, service, serviceData);
    }

    try {
      const res = await fetch(`${this.url}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!res.ok) {
        console.warn(`[HA Client] Service call failed with status ${res.status}, executing in local simulation`);
        return this.handleMockServiceCall(domain, service, serviceData);
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`[HA Client] Service call network error: ${err.message}, simulating locally`);
      return this.handleMockServiceCall(domain, service, serviceData);
    }
  }

  private handleMockServiceCall(domain: string, service: string, data: any) {
    const entityId = data.entity_id;
    if (!entityId) return { success: true, simulated: true };

    const entity = this.inMemoryStates.get(entityId);
    if (!entity) return { success: true, simulated: true };

    const now = new Date().toISOString();

    if (service === 'toggle') {
      entity.state = entity.state === 'on' ? 'off' : 'on';
    } else if (service === 'turn_on') {
      entity.state = 'on';
      if (data.brightness !== undefined) {
        entity.attributes.brightness = data.brightness;
      }
      if (data.rgb_color !== undefined) {
        entity.attributes.rgb_color = data.rgb_color;
      }
    } else if (service === 'turn_off') {
      entity.state = 'off';
    } else if (service === 'set_temperature' && data.temperature !== undefined) {
      entity.attributes.temperature = data.temperature;
    }

    entity.last_changed = now;
    entity.last_updated = now;
    this.inMemoryStates.set(entityId, entity);

    return { success: true, simulated: true, entity };
  }
}
