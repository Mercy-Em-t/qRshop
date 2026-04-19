import { PLANS } from "../config/plans";

/**
 * Unified Shop Model
 * Encapsulates raw database data with business logic for naming, plans, and capabilities.
 */
export class Shop {
  constructor(data) {
    if (!data) return;
    
    // Core data
    this.id = data.id;
    this.name = data.name;
    this.subdomain = data.subdomain;
    this.phone = data.phone;
    this.tagline = data.tagline;
    this.address = data.address;
    this.industry_type = data.industry_type || 'food';
    this.planId = data.plan || 'free';
    this.is_online = data.is_online !== false;
    this.verification_level = data.verification_level;
    this.logo_url = data.logo_url;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.service_radius = data.service_radius;
    this.subscription_expires_at = data.subscription_expires_at;
    this.created_at = data.created_at;

    // Derived properties
    this.plan = PLANS.find(p => p.id === this.planId) || PLANS[0];
    this.isSubscriptionActive = !this.subscription_expires_at || new Date(this.subscription_expires_at) > new Date();
  }

  /**
   * Returns industry-specific terminology
   */
  getTerms() {
    const defaultTerms = {
      menu: "Menu",
      table: "Table",
      order: "Order",
      kitchen: "Kitchen",
      chef: "Chef",
      eating: "dining"
    };

    if (this.industry_type === 'service') {
      return {
        menu: "Services",
        table: "Station",
        order: "Appointment",
        kitchen: "Staff",
        chef: "Specialist",
        eating: "visiting"
      };
    }
    
    if (this.industry_type === 'retail') {
      return {
        menu: "Catalog",
        table: "Checkout",
        order: "Purchase",
        kitchen: "Fulfillment",
        chef: "Packer",
        eating: "shopping"
      };
    }

    return defaultTerms;
  }

  /**
   * Capability checks
   */
  canCheckout() {
    return this.plan.features.find(f => f.text === "Auto-checkout routing")?.active || false;
  }

  hasAutomatedBot() {
    return this.plan.features.find(f => f.text === "Automated WhatsApp Bot")?.active || false;
  }

  hasAnalytics() {
    return this.plan.features.find(f => f.text === "Historical Analytics Tracking")?.active || false;
  }

  isGold() {
    return this.verification_level === 'gold';
  }

  /**
   * Returns a friendly status label
   */
  getStatusLabel() {
    return this.is_online ? "Open" : "Closed";
  }
}
