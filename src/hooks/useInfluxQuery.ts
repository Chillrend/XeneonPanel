import { useState, useEffect, useCallback, useRef } from 'react';
import type { MetricPoint } from '../types';

interface UseInfluxQueryOptions {
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
  pollIntervalMs?: number;
}

export function useInfluxQuery({
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
  pollIntervalMs = 8000,
}: UseInfluxQueryOptions) {
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        bucket,
        measurement,
        field,
        range,
        window,
      });

      if (entityId) params.append('entityId', entityId);
      if (host) params.append('host', host);
      if (sensor) params.append('sensor', sensor);
      if (targetUrl) params.append('url', targetUrl);
      if (ifName) params.append('ifName', ifName);
      if (isNetworkRate) params.append('isNetworkRate', 'true');
      if (tagKey) params.append('tagKey', tagKey);
      if (tagValue) params.append('tagValue', tagValue);

      const res = await fetch(`/api/influx/history?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (isMountedRef.current) {
        const newPoints: MetricPoint[] = data.points || [];
        setPoints((prev) => {
          if (prev.length === newPoints.length && prev.length > 0) {
            const pLast = prev[prev.length - 1];
            const nLast = newPoints[newPoints.length - 1];
            if (pLast.time === nLast.time && pLast.value === nLast.value) {
              return prev;
            }
          }
          return newPoints;
        });
        setError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch InfluxDB metrics');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [bucket, measurement, field, entityId, host, sensor, targetUrl, ifName, isNetworkRate, tagKey, tagValue, range, window]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    const interval = setInterval(fetchData, pollIntervalMs);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData, pollIntervalMs]);

  const latestValue = points.length > 0 ? points[points.length - 1].value : 0;
  const previousValue = points.length > 1 ? points[points.length - 2].value : latestValue;
  const delta = Number((latestValue - previousValue).toFixed(1));

  return {
    points,
    latestValue,
    delta,
    isLoading,
    error,
    refetch: fetchData,
  };
}
