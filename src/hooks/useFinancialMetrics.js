import { useEffect, useState } from 'react';
import { defaultMetrics } from '../data/financialData';

const edgeBaseUrl = import.meta.env.VITE_CFO_EDGE_URL || '';

function getStreamUrl() {
  return `${edgeBaseUrl}/api/v1/stream/metrics`;
}

export function useFinancialMetrics() {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [connection, setConnection] = useState(
    edgeBaseUrl ? 'connecting' : 'sample'
  );

  useEffect(() => {
    if (!edgeBaseUrl) return undefined;

    let mounted = true;
    const stream = new EventSource(getStreamUrl());

    const handleMetrics = (event) => {
      try {
        const nextMetrics = JSON.parse(event.data);

        if (mounted) {
          setMetrics((current) => ({ ...current, ...nextMetrics }));
          setConnection('live');
        }
      } catch {
        if (mounted) setConnection('degraded');
      }
    };

    stream.addEventListener('metrics', handleMetrics);
    stream.onopen = () => mounted && setConnection('live');
    stream.onerror = () => mounted && setConnection('sample');

    return () => {
      mounted = false;
      stream.removeEventListener('metrics', handleMetrics);
      stream.close();
    };
  }, []);

  return { metrics, connection };
}