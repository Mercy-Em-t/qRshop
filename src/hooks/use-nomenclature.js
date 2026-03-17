import { useShop } from "./use-shop";

export function getTerms(type) {
  const defaultTerms = {
    menu: "Menu",
    table: "Table",
    order: "Order",
    kitchen: "Kitchen",
    chef: "Chef",
    eating: "dining"
  };

  if (type === 'service') {
      return {
         menu: "Services",
         table: "Station",
         order: "Appointment",
         kitchen: "Staff",
         chef: "Specialist",
         eating: "visiting"
      };
  }
  if (type === 'retail') {
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

export function useNomenclature(shopId) {
  const { shop } = useShop(shopId);
  const type = shop?.industry_type || 'food';
  return getTerms(type);
}
