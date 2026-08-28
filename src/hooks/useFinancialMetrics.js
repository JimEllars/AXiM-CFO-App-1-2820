import { useEffect, useState, useRef } from 'react';
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

  const retryTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000;

  useEffect(() => {
    if (!edgeBaseUrl) return undefined;

    let mounted = true;
    let stream = null;

    const connect = () => {
      if (!mounted) return;

      stream = new EventSource(getStreamUrl());

      const handleMetrics = (event) => {
        try {
          const nextMetrics = JSON.parse(event.data);

          if (mounted) {
            setMetrics((current) => ({ ...current, ...nextMetrics }));
            setConnection('live');
            reconnectAttempts.current = 0;
          }
        } catch {
          if (mounted) setConnection('degraded');
        }
      };

      stream.addEventListener('metrics', handleMetrics);

      stream.onopen = () => {
        if (mounted) {
          setConnection('live');
          reconnectAttempts.current = 0;
        }
      };

      stream.onerror = () => {
        stream.close();

        if (mounted) {
          setConnection('connecting');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), maxReconnectDelay);
          reconnectAttempts.current++;
          retryTimeout.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      mounted = false;
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (stream) stream.close();
    };
  }, []);

  return { metrics, connection };
}
