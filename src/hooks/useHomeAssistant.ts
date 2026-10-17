import { useState, useEffect, useCallback, useRef } from 'react';
import type { HAEntity } from '../types';

export function useHomeAssistant(pollIntervalMs: number = 3000) {
  const [entities, setEntities] = useState<Record<string, HAEntity>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch('/api/ha/states');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HAEntity[] = await res.json();
      
      if (isMountedRef.current) {
        const entityMap: Record<string, HAEntity> = {};
        for (const item of data) {
          entityMap[item.entity_id] = item;
        }
        setEntities(entityMap);
        setLastError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setLastError(err.message || 'Failed to fetch HA states');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStates();

    const interval = setInterval(fetchStates, pollIntervalMs);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStates, pollIntervalMs]);

  const callService = useCallback(
    async (domain: string, service: string, serviceData: Record<string, any> = {}) => {
      // Optimistic update for toggles and brightness
      const entityId = serviceData.entity_id;
      if (entityId && entities[entityId]) {
        const current = entities[entityId];
        let nextState = current.state;
        let nextAttrs = { ...current.attributes };

        if (service === 'toggle') {
          nextState = current.state === 'on' ? 'off' : 'on';
        } else if (service === 'turn_on') {
          nextState = 'on';
          if (serviceData.brightness !== undefined) {
            nextAttrs.brightness = serviceData.brightness;
          }
        } else if (service === 'turn_off') {
          nextState = 'off';
        }

        setEntities((prev) => ({
          ...prev,
          [entityId]: {
            ...current,
            state: nextState,
            attributes: nextAttrs,
            last_updated: new Date().toISOString(),
          },
        }));
      }

      try {
        const res = await fetch(`/api/ha/services/${domain}/${service}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        });

        if (!res.ok) {
          throw new Error(`Service call failed: HTTP ${res.status}`);
        }

        // Re-fetch shortly to confirm authoritative state
        setTimeout(fetchStates, 300);
      } catch (err: any) {
        console.error('[useHomeAssistant] callService error:', err);
        // Rollback on next poll
        fetchStates();
      }
    },
    [entities, fetchStates]
  );

  const toggle = useCallback(
    (entityId: string) => {
      const domain = entityId.split('.')[0] || 'switch';
      return callService(domain, 'toggle', { entity_id: entityId });
    },
    [callService]
  );

  const setBrightness = useCallback(
    (entityId: string, brightnessPercent: number) => {
      const brightness = Math.round((brightnessPercent / 100) * 255);
      return callService('light', 'turn_on', {
        entity_id: entityId,
        brightness,
      });
    },
    [callService]
  );

  return {
    entities,
    isLoading,
    lastError,
    refetch: fetchStates,
    callService,
    toggle,
    setBrightness,
  };
}
