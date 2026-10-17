import { useState, useEffect } from 'react';
import type { SystemStatus } from '../types';

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data: SystemStatus = await res.json();
          if (isMounted) setStatus(data);
        }
      } catch {
        // Ignored
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
