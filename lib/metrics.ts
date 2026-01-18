// Metrics functions - stub implementations
// These will be implemented when database integration is added

export type SubscriberStatus = 'ACTIVE' | 'AT_RISK' | 'TRIAL' | 'CHURNED';

export async function getMRR(userId: string): Promise<number> {
  console.log(`[Stub] getMRR called for user ${userId}`);
  return 0;
}

export async function getSubscriberCount(
  userId: string,
  status?: SubscriberStatus
): Promise<number> {
  console.log(`[Stub] getSubscriberCount called for user ${userId}, status: ${status}`);
  return 0;
}

export async function getChurnRate(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  console.log(`[Stub] getChurnRate called for user ${userId}, period: ${periodDays} days`);
  return 0;
}

export async function getAverageLTV(userId: string): Promise<number> {
  console.log(`[Stub] getAverageLTV called for user ${userId}`);
  return 0;
}

export async function getMRRGrowth(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  console.log(`[Stub] getMRRGrowth called for user ${userId}, period: ${periodDays} days`);
  return 0;
}

export async function getSubscriberCountChange(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  console.log(`[Stub] getSubscriberCountChange called for user ${userId}, period: ${periodDays} days`);
  return 0;
}

export interface DashboardMetrics {
  mrr: number;
  mrrChange: number;
  totalSubscribers: number;
  subscribersChange: number;
  churnRate: number;
  avgLtv: number;
  activeCount: number;
  atRiskCount: number;
  trialCount: number;
  churnedCount: number;
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  console.log(`[Stub] getDashboardMetrics called for user ${userId}`);
  return {
    mrr: 0,
    mrrChange: 0,
    totalSubscribers: 0,
    subscribersChange: 0,
    churnRate: 0,
    avgLtv: 0,
    activeCount: 0,
    atRiskCount: 0,
    trialCount: 0,
    churnedCount: 0,
  };
}
