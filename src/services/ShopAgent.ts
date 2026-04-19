import { supabase } from "./supabase-client.js";
import { NotificationService } from "./notification-service.js";

/**
 * AI Shop Worker Agent
 * Manages autonomous shop operations: order review, fulfillment coordination, 
 * and inventory/procurement triggers.
 */
export class ShopAgent {
  private shopId: string;

  constructor(shopId: string) {
    this.shopId = shopId;
  }

  /**
   * Start the agent's realtime listener
   */
  public async activate() {
    if (!supabase) return;

    supabase
      .channel(`shop_agent_${this.shopId}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${this.shopId}` },
        (payload: any) => this.handleNewOrder(payload.new)
      )
      .subscribe();
  }

  /**
   * Process a incoming order
   */
  private async handleNewOrder(order: any) {
    console.log(`[ShopAgent] New Order Detected: ${order.id}`);
    
    // 1. Autonomous Acceptance Logic
    const shouldAccept = await this.evaluateOrder(order);
    
    if (shouldAccept) {
        await this.acceptOrder(order.id);
    } else {
        await this.requestEscalation(order.id);
    }
  }

  private async evaluateOrder(order: any): Promise<boolean> {
    // Simulate inventory check (could be expanded to query public.menu_items stock)
    // For now, auto-accept unless it's a huge order or high risk
    return order.total_price < 50000; 
  }

  private async acceptOrder(orderId: string) {
    if (!supabase) return;
    console.log(`[ShopAgent] Auto-accepting order ${orderId}`);
    
    await supabase
        .from('orders')
        .update({ 
            status: 'accepted', 
            auto_accepted: true,
            ai_agent_status: 'processing',
            fulfillment_deadline: new Date(Date.now() + 30 * 60000).toISOString() // 30 min target
        })
        .eq('id', orderId);

    // Trigger internal workflow: Set 'Ready for Pickup' in 15 mins
    setTimeout(() => this.markReadyForPickup(orderId), 15 * 60000);
  }

  private async markReadyForPickup(orderId: string) {
     if (!supabase) return;
     await supabase
        .from('orders')
        .update({ status: 'ready_for_pickup', delivery_status: 'pending_pickup' })
        .eq('id', orderId);
     
     // Fetch basic order info for notification
     const { data } = await supabase.from('orders').select('*, shops(name)').eq('id', orderId).single();
     if (data) {
        NotificationService.triggerStatusUpdate({ 
            orderId: data.id,
            shopName: data.shops?.name || "The Shop",
            clientName: data.client_name || "Customer",
            clientPhone: data.client_phone || ""
        }, 'ready');
     }
  }

  private async requestEscalation(orderId: string) {
    if (!supabase) return;
    console.warn(`[ShopAgent] Order ${orderId} requires human intervention.`);
    await supabase
        .from('orders')
        .update({ ai_agent_status: 'escalated' })
        .eq('id', orderId);
  }

  /**
   * Procurement Logic: Re-order from supplier if stock is low
   */
  public async performInventoryAudit() {
     // Mock inventory check: if any active items are < 5, notify boss
     console.log("[ShopAgent] Performing inventory audit...");
     // In a real app, this would query a 'inventory' table.
  }
}
