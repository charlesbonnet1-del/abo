// Format amount in cents to euros
export function formatCurrency(amountInCents: number | null, currency = 'eur'): string {
  if (amountInCents === null || amountInCents === undefined) return '-';
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get start of current month
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Get start of current month as ISO string
export function getStartOfMonthISO(): string {
  return getStartOfMonth().toISOString();
}

// Classnames utility
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
