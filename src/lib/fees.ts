// Prisbasbelopp per år (uppdateras årligen av SCB)
const PRICE_BASE_AMOUNTS: Record<number, number> = {
  2024: 57300,
  2025: 58800,
  2026: 59800, // Prognos
};

export function getPriceBaseAmount(year?: number): number {
  const y = year ?? new Date().getFullYear();
  return PRICE_BASE_AMOUNTS[y] ?? PRICE_BASE_AMOUNTS[Math.max(...Object.keys(PRICE_BASE_AMOUNTS).map(Number))];
}

export function calculateTransferFee(maxPercent: number, year?: number): number {
  const pbb = getPriceBaseAmount(year);
  return Math.round((maxPercent / 100) * pbb);
}

export function calculatePledgeFee(maxPercent: number, year?: number): number {
  const pbb = getPriceBaseAmount(year);
  return Math.round((maxPercent / 100) * pbb);
}

export function calculateSubletFee(maxPercent: number, year?: number): number {
  const pbb = getPriceBaseAmount(year);
  return Math.round((maxPercent / 100) * pbb);
}
