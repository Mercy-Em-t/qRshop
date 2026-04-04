/**
 * SYSTEM A <-> SYSTEM B INTERCONNECTION SDK
 * Zero-dependency client for the defined JSON Communication Protocol.
 */

export interface SystemBCustomer {
  name: string;
  email: string;
  address: string;
}

export interface SystemBItem {
  product_id: string;
  quantity: number;
}

export interface SystemBOrderInput {
  order_id: string;
  customer: SystemBCustomer;
  items: SystemBItem[];
  total: number;
  payment_status: 'paid' | 'pending';
  // --- Bundle Attribution ---
  applied_promotion_id?: string;
  promotion_name?: string;
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
   * Submit a New Order from System A to System B.
   * Target endpoint: POST /orders/new
   */
  async placeOrder(order: SystemBOrderInput): Promise<GatewayResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/new`, {
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
        orderId: result.order_id,
        trackingUrl: result.tracking_url,
        error: result.error,
        message: result.message
      };
    } catch (err: any) {
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    }
  }

  /**
   * Cancel an existing order.
   * Target endpoint: POST /orders/cancel
   */
  async cancelOrder(orderId: string, reason: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({ order_id: orderId, reason })
      });
      return await response.json();
    } catch (err: any) {
      return { error: 'CANCEL_ERROR', message: err.message };
    }
  }
}
