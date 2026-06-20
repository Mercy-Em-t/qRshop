'use client';

import { useState, useCallback } from 'react';
import { OrderGatewaySDK, GatewayOrderInput, GatewayResponse } from '../lib/gateway-sdk';

export function useGateway(apiKey: string, baseUrl: string) {
  const [sdk] = useState(() => new OrderGatewaySDK(apiKey, baseUrl));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<GatewayResponse | null>(null);

  const submitOrder = useCallback(async (order: GatewayOrderInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sdk.placeOrder(order);
      if (!response.success) {
        setError(response.error || 'ORDER_FAILED');
      } else {
        setLastOrder(response);
      }
      return response;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: 'UNKNOWN_EXCEPTION' };
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  return { submitOrder, loading, error, lastOrder };
}
