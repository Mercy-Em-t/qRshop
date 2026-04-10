import { 
  buildWhatsAppMessage, 
  buildStatusUpdateMessage, 
  buildPaymentPromptMessage, 
  buildAmendmentConfirmation, 
  buildWhatsAppLink 
} from "../utils/whatsapp-builder.js";
import { supabase } from "./supabase-client.js";

/**
 * Notification Service (based on Communication Protocols)
 * Handles structured messaging for order lifecycle and prevents flooding.
 */

export interface NotificationPayload {
  orderId: string;
  shopName: string;
  clientName: string;
  clientPhone: string;
  total?: number;
}

export const NotificationService = {
  /**
   * Sends the initial order receipt confirmation to the customer.
   */
  async triggerOrderReceived(payload: NotificationPayload, items: any[], table: string, fulfillmentType: string, address: string, deliveryFee: number) {
     const message = buildWhatsAppMessage(
        payload.shopName,
        table,
        items,
        payload.orderId,
        payload.total || 0,
        0, // discount
        false, // isOffline
        payload.clientName,
        payload.clientPhone,
        fulfillmentType,
        address,
        deliveryFee
     );
     
     this._dispatchWhatsApp(payload.clientPhone, message);
     this._logNotification(payload.orderId, 'order_received');
  },

  /**
   * Sends a status update (Confirmed, Ready, etc.) to the customer.
   */
  async triggerStatusUpdate(payload: NotificationPayload, newStatus: string) {
     const message = buildStatusUpdateMessage(
        payload.shopName,
        payload.orderId,
        newStatus,
        payload.clientName
     );
     
     this._dispatchWhatsApp(payload.clientPhone, message);
     this._logNotification(payload.orderId, `status_${newStatus}`);
  },

  /**
   * Prompts the customer for payment.
   */
  async triggerPaymentPrompt(payload: NotificationPayload, paymentDetails: string) {
     const message = buildPaymentPromptMessage(
        payload.shopName,
        payload.orderId,
        payload.total || 0,
        paymentDetails
     );
     
     this._dispatchWhatsApp(payload.clientPhone, message);
     this._logNotification(payload.orderId, 'payment_prompt');
  },

  /**
   * Confirms an amendment to the customer.
   */
  async triggerAmendmentConfirmation(payload: NotificationPayload, changes: string) {
     const message = buildAmendmentConfirmation(
        payload.shopName,
        payload.orderId,
        changes
     );
     
     this._dispatchWhatsApp(payload.clientPhone, message);
     this._logNotification(payload.orderId, 'order_amended');
  },

  /**
   * Private: Dispatches the message via the WhatsApp link (Manual for free, SDK for Pro)
   * In a real implementation with a WhatsApp Business API, this would call an external API.
   * For the current hybrid flow, we generate the link and let the UI handle the window.location.href.
   */
  _dispatchWhatsApp(phone: string, message: string) {
     const link = buildWhatsAppLink(phone, message);
     // Note: In an edge function environment, we'd use a messaging provider.
     // Here, we emit the link for the frontend to consume.
     console.debug(`[Notification Service] Dispatching to ${phone}:\n${message}`);
     return link; 
  },

  /**
   * Private: Logs the notification to Supabase for audit trail.
   */
  async _logNotification(orderId: string, type: string) {
     if (!supabase) return;
     try {
        await supabase.from('order_notifications').insert({
           order_id: orderId,
           notification_type: type,
           sent_at: new Date().toISOString()
        });
     } catch (e) {
        console.warn("Audit Log Failed:", e);
     }
  }
};
