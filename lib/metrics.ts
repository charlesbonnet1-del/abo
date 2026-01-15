import prisma from '@/lib/prisma';
import { SubscriberStatus } from '@prisma/client';

export async function getMRR(userId: string): Promise<number> {
  const result = await prisma.subscriber.aggregate({
    where: {
      userId,
      status: {
        in: ['ACTIVE', 'TRIAL'],
      },
    },
    _sum: {
      mrr: true,
    },
  });

  return result._sum.mrr || 0;
}

export async function getSubscriberCount(
  userId: string,
  status?: SubscriberStatus
): Promise<number> {
  return prisma.subscriber.count({
    where: {
      userId,
      ...(status && { status }),
    },
  });
}

export async function getChurnRate(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get subscribers at start of period (approximate by using firstSeenAt < startDate)
  const subscribersAtStart = await prisma.subscriber.count({
    where: {
      userId,
      firstSeenAt: {
        lt: startDate,
      },
    },
  });

  if (subscribersAtStart === 0) {
    return 0;
  }

  // Get churned subscribers in the period
  const churnedInPeriod = await prisma.subscriber.count({
    where: {
      userId,
      status: 'CHURNED',
      updatedAt: {
        gte: startDate,
      },
    },
  });

  return Math.round((churnedInPeriod / subscribersAtStart) * 100 * 10) / 10;
}

export async function getAverageLTV(userId: string): Promise<number> {
  const result = await prisma.subscriber.aggregate({
    where: {
      userId,
      ltv: {
        gt: 0,
      },
    },
    _avg: {
      ltv: true,
    },
  });

  return Math.round(result._avg.ltv || 0);
}

export async function getMRRGrowth(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  // This is a simplified calculation
  // In production, you'd want to track historical MRR snapshots
  const currentMRR = await getMRR(userId);

  // Get MRR from subscribers who joined before the period
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const previousMRR = await prisma.subscriber.aggregate({
    where: {
      userId,
      status: {
        in: ['ACTIVE', 'TRIAL'],
      },
      firstSeenAt: {
        lt: startDate,
      },
    },
    _sum: {
      mrr: true,
    },
  });

  const prevMRRValue = previousMRR._sum.mrr || 0;

  if (prevMRRValue === 0) {
    return currentMRR > 0 ? 100 : 0;
  }

  return Math.round(((currentMRR - prevMRRValue) / prevMRRValue) * 100 * 10) / 10;
}

export async function getSubscriberCountChange(
  userId: string,
  periodDays: number = 30
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const newSubscribers = await prisma.subscriber.count({
    where: {
      userId,
      firstSeenAt: {
        gte: startDate,
      },
    },
  });

  const totalSubscribers = await prisma.subscriber.count({
    where: { userId },
  });

  if (totalSubscribers === 0) {
    return 0;
  }

  return Math.round((newSubscribers / totalSubscribers) * 100 * 10) / 10;
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
  const [
    mrr,
    mrrChange,
    totalSubscribers,
    subscribersChange,
    churnRate,
    avgLtv,
    activeCount,
    atRiskCount,
    trialCount,
    churnedCount,
  ] = await Promise.all([
    getMRR(userId),
    getMRRGrowth(userId),
    getSubscriberCount(userId),
    getSubscriberCountChange(userId),
    getChurnRate(userId),
    getAverageLTV(userId),
    getSubscriberCount(userId, 'ACTIVE'),
    getSubscriberCount(userId, 'AT_RISK'),
    getSubscriberCount(userId, 'TRIAL'),
    getSubscriberCount(userId, 'CHURNED'),
  ]);

  return {
    mrr,
    mrrChange,
    totalSubscribers,
    subscribersChange,
    churnRate,
    avgLtv,
    activeCount,
    atRiskCount,
    trialCount,
    churnedCount,
  };
}
