/** Format paise to INR string: 4500 → "₹45.00" */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

/** Format paise to compact: 450000 → "₹4,500" */
export function formatINRCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }
  return `₹${rupees}`;
}

/** Round up to nearest 10 rupees (for donations) */
export function roundUpRupees(paise: number): number {
  const rupees = Math.ceil(paise / 100 / 10) * 10;
  return rupees * 100 - paise;
}
