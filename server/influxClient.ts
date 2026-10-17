import { InfluxDB } from '@influxdata/influxdb-client';
import { generateMockTimeSeries, MetricPoint } from './mockData';

export interface InfluxHistoryOptions {
  bucket?: string;
  measurement: string;
  field?: string;
  entityId?: string;
  host?: string;
  sensor?: string;
  url?: string;
  ifName?: string;
  isNetworkRate?: boolean;
  tagKey?: string;
  tagValue?: string;
  range?: string;
  window?: string;
}

export class InfluxClient {
  private url: string;
  private token: string;
  private org: string;
  private isConfigured: boolean;
  private client: InfluxDB | null = null;

  constructor() {
    this.url = process.env.INFLUX_URL || 'http://10.34.11.2:8086';
    this.token = process.env.INFLUX_TOKEN || '';
    this.org = process.env.INFLUX_ORG || "Farhan's Homelab";
    this.isConfigured = Boolean(this.token && this.token.trim().length > 10);

    if (this.isConfigured) {
      try {
        this.client = new InfluxDB({ url: this.url, token: this.token });
      } catch (err: any) {
        console.error('[InfluxDB Client] Init error:', err.message);
        this.client = null;
      }
    }
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      url: this.url,
      org: this.org,
      mode: this.isConfigured ? 'live' : 'simulation',
    };
  }

  /**
   * Execute raw Flux query
   */
  public async queryFlux(fluxQuery: string): Promise<any[]> {
    if (!this.client || !this.isConfigured) {
      return [];
    }

    const queryApi = this.client.getQueryApi(this.org);
    const rows: any[] = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          rows.push(o);
        },
        error(error) {
          console.warn('[InfluxDB] Query error:', error.message);
          reject(error);
        },
        complete() {
          resolve(rows);
        },
      });
    });
  }

  /**
   * Fetch metric points with tag filtering
   */
  public async getMetricHistory(options: InfluxHistoryOptions): Promise<MetricPoint[]> {
    const {
      bucket = 'farhan_homelab',
      measurement,
      field = 'value',
      entityId,
      host,
      sensor,
      url: targetUrl,
      ifName,
      isNetworkRate,
      tagKey,
      tagValue,
      range = '2h',
      window = '2m',
    } = options;

    if (this.client && this.isConfigured) {
      if (isNetworkRate) {
        const fluxQuery = `
          from(bucket: "${bucket}")
            |> range(start: -${range})
            |> filter(fn: (r) => r._measurement == "${measurement}" and r.ifName == "${ifName || 'ether1'}" and r._field == "${field || 'ifHCInOctets'}")
            |> derivative(unit: 1s, nonNegative: true)
            |> map(fn: (r) => ({ r with _value: (r._value * 8.0) / 1000000.0 }))
            |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
            |> yield(name: "mean")
        `;
        try {
          const rows = await this.queryFlux(fluxQuery);
          if (rows.length > 0) {
            return rows.map((r) => ({
              time: r._time,
              value: Number(Number(r._value).toFixed(2)),
            }));
          }
        } catch (err: any) {
          console.warn(`[InfluxDB] Rate query failed: ${err.message}`);
        }
      }

      // Build filter expression
      const filters = [`r._measurement == "${measurement}"`, `r._field == "${field}"`];

      if (entityId) {
        filters.push(`r.entity_id == "${entityId}"`);
      }
      if (host) {
        filters.push(`r.host == "${host}"`);
      }
      if (sensor) {
        filters.push(`r.sensor == "${sensor}"`);
      }
      if (targetUrl) {
        filters.push(`r.url == "${targetUrl}"`);
      }
      if (ifName) {
        filters.push(`r.ifName == "${ifName}"`);
      }
      if (tagKey && tagValue) {
        filters.push(`r["${tagKey}"] == "${tagValue}"`);
      }

      const filterClause = filters.join(' and ');

      const fluxQuery = `
        from(bucket: "${bucket}")
          |> range(start: -${range})
          |> filter(fn: (r) => ${filterClause})
          |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
          |> yield(name: "mean")
      `;

      try {
        const rows = await this.queryFlux(fluxQuery);
        if (rows.length > 0) {
          return rows.map((r) => {
            let val = Number(r._value);
            // If querying CPU idle, calculate load = 100 - idle
            if (field === 'usage_idle') {
              val = 100 - val;
            }
            return {
              time: r._time,
              value: Number(val.toFixed(1)),
            };
          });
        }
      } catch (err: any) {
        console.warn(`[InfluxDB] Query failed for ${measurement}/${entityId || host}: ${err.message}`);
      }
    }

    // Mock fallback if offline
    return this.getMockTelemetryForMetric(measurement, entityId || host || '');
  }

  private getMockTelemetryForMetric(measurement: string, identifier: string): MetricPoint[] {
    const key = `${measurement}_${identifier}`.toLowerCase();

    if (key.includes('voltage') || key.includes('v')) {
      return generateMockTimeSeries(208.5, 3.0, 24, 5);
    }
    if (key.includes('power') || key.includes('w')) {
      return generateMockTimeSeries(380, 25, 24, 5);
    }
    if (key.includes('temp') || key.includes('°c')) {
      return generateMockTimeSeries(29.5, 1.2, 24, 5);
    }
    if (key.includes('humidity') || key.includes('%')) {
      return generateMockTimeSeries(64.0, 3.0, 24, 5);
    }
    if (key.includes('cpu')) {
      return generateMockTimeSeries(18.0, 8.0, 24, 5);
    }
    if (key.includes('ups') || key.includes('battery')) {
      return generateMockTimeSeries(100, 0, 24, 5);
    }
    if (key.includes('ping') || key.includes('ms')) {
      return generateMockTimeSeries(3.4, 0.4, 24, 5);
    }
    if (key.includes('rate') || key.includes('interface')) {
      return generateMockTimeSeries(4.2, 1.8, 24, 5);
    }

    return generateMockTimeSeries(50, 10, 24, 5);
  }
}
