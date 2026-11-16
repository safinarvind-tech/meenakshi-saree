// Shared pricing rules. Used by the storefront (display) and the server (source of truth).
// All values in paise.

export const BLOUSE_OPTIONS = {
  UNSTITCHED: { label: "Unstitched blouse piece", price: 0 },
  STITCHED: { label: "Stitched to my measurements", price: 1200_00 },
  DESIGNER: { label: "Designer blouse", price: 3500_00 },
} as const;
export type BlouseOption = keyof typeof BLOUSE_OPTIONS;
export const BLOUSE_KEYS = Object.keys(BLOUSE_OPTIONS) as BlouseOption[];

export const ADD_ONS = {
  FALL_PICO: { label: "Fall & pico", price: 250_00 },
  GIFT_WRAP: { label: "Gift wrap", price: 150_00 },
} as const;
export type AddOn = keyof typeof ADD_ONS;
export const ADD_ON_KEYS = Object.keys(ADD_ONS) as AddOn[];

export const FREE_SHIPPING_ABOVE = 5000_00;
export const SHIPPING_FEE = 150_00;

export function unitPrice(base: number, blouse: BlouseOption, addOns: AddOn[]) {
  return base + BLOUSE_OPTIONS[blouse].price + addOns.reduce((sum, a) => sum + ADD_ONS[a].price, 0);
}

export function shippingFor(subtotalAfterDiscount: number) {
  if (subtotalAfterDiscount === 0 || subtotalAfterDiscount >= FREE_SHIPPING_ABOVE) return 0;
  return SHIPPING_FEE;
}
