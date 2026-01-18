// Health score calculation utilities

export type SubscriberStatus = 'ACTIVE' | 'AT_RISK' | 'TRIAL' | 'CHURNED';

interface HealthScoreInput {
  failedPayments: number;
  successfulPayments: number;
  firstPaymentDate: Date;
  plan: string | null;
  cardExpiresAt: Date | null;
}

export function calculateHealthScore(input: HealthScoreInput): number {
  let score = 50; // Base score

  // Deduct for failed payments (-30 per failure, min -60)
  const failedPenalty = Math.min(input.failedPayments * 30, 60);
  score -= failedPenalty;

  // Add for tenure (+1 per month, max 20)
  const monthsActive = Math.floor(
    (Date.now() - input.firstPaymentDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  score += Math.min(monthsActive, 20);

  // Add for plan type
  if (input.plan) {
    const planLower = input.plan.toLowerCase();
    if (planLower.includes('pro') || planLower.includes('business') || planLower.includes('enterprise')) {
      score += 10;
    }
  }

  // Add for consecutive successful payments (+5 per payment, max 30)
  const paymentBonus = Math.min(input.successfulPayments * 5, 30);
  score += paymentBonus;

  // Deduct if card expiring soon (-20 if < 30 days)
  if (input.cardExpiresAt) {
    const daysUntilExpiry = Math.floor(
      (input.cardExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
      score -= 20;
    }
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export function determineStatus(
  healthScore: number,
  currentStatus: SubscriberStatus
): SubscriberStatus {
  // If already churned, keep it
  if (currentStatus === 'CHURNED') {
    return 'CHURNED';
  }

  // If in trial, keep trial status
  if (currentStatus === 'TRIAL') {
    return 'TRIAL';
  }

  // Determine based on health score
  if (healthScore < 30) {
    return 'AT_RISK';
  } else if (healthScore < 70) {
    return 'AT_RISK';
  }

  return 'ACTIVE';
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getHealthScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
}
