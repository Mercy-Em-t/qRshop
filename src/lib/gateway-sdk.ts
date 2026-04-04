/**
 * MASTER ORDER GATEWAY SDK — ZERO DEPENDENCY
 */
export interface GatewayOrderInput {
  customerName: string;
  phone: string;
  shopId: string;
  deliveryType: 'pickup' | 'delivery';
  items: Array<{ 
    productId: string; 
    qty: number; 
    name?: string; 
    price?: number; 
    subtotal?: number 
  }>;
  location?: string;
  notes?: string;
}

export interface GatewayResponse {
  success: boolean;
  orderId?: string;
  trackingUrl?: string;
  error?: string;
  message?: string;
}

export class OrderGatewaySDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Submit an order to the gateway.
   */
  async placeOrder(order: GatewayOrderInput): Promise<GatewayResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(order)
      });
      const result = await response.json();
      return {
        success: response.ok,
        orderId: result.orderId,
        trackingUrl: result.trackingUrl,
        error: result.error,
        message: result.message
      };
    } catch (err: any) {
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    }
  }

  /**
   * Fetch the current live status of an order.
   */
  async getStatus(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/status?orderId=${orderId}`, {
        headers: { 'x-api-key': this.apiKey }
      });
      return await response.json();
    } catch (err: any) {
      return { error: 'FETCH_ERROR', message: err.message };
    }
  }
}
