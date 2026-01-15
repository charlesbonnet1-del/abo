import Link from 'next/link';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { SubscriberStatus } from '@prisma/client';
import { SubscriberTable } from '@/components/subscribers/subscriber-table';

interface SearchParams {
  status?: string;
  search?: string;
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user) {
    return null;
  }

  // Parse status filter
  const statusFilter = params.status as SubscriberStatus | undefined;
  const searchQuery = params.search || '';

  // Get subscribers with filters
  const subscribers = await prisma.subscriber.findMany({
    where: {
      userId: user.id,
      ...(statusFilter && { status: statusFilter }),
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: [
      { status: 'asc' },
      { mrr: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      plan: true,
      mrr: true,
      healthScore: true,
      firstSeenAt: true,
    },
  });

  // Get counts for filters
  const counts = await prisma.subscriber.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: true,
  });

  const countByStatus: Record<string, number> = {
    all: counts.reduce((sum, c) => sum + c._count, 0),
  };
  counts.forEach((c) => {
    countByStatus[c.status] = c._count;
  });

  const filters = [
    { value: '', label: 'Tous', count: countByStatus.all || 0 },
    { value: 'ACTIVE', label: 'Actifs', count: countByStatus.ACTIVE || 0 },
    { value: 'AT_RISK', label: 'À risque', count: countByStatus.AT_RISK || 0 },
    { value: 'TRIAL', label: 'Trial', count: countByStatus.TRIAL || 0 },
    { value: 'CHURNED', label: 'Churnés', count: countByStatus.CHURNED || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abonnés</h1>
        <div className="flex gap-2">
          <form className="relative flex-1 sm:w-64">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </form>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((filter) => {
          const isActive =
            (filter.value === '' && !statusFilter) ||
            filter.value === statusFilter;
          const href =
            filter.value === ''
              ? '/subscribers'
              : `/subscribers?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-70">({filter.count})</span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <SubscriberTable subscribers={subscribers} />

      {/* Count */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        {subscribers.length} abonné{subscribers.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
