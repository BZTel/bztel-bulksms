// Flat rate pricing: 1 SMS Credit = 6.5 Naira (NGN 6.50)
export const NGN_PER_CREDIT = 6.5;

export function computeExpectedNgnAmount(credits: number): number {
  return Math.round(credits * NGN_PER_CREDIT * 100) / 100;
}
