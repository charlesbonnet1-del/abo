'use client';

import Link from 'next/link';
import { SubscriberStatus } from '@prisma/client';
import { StatusDot } from '@/components/ui/badge';

interface SubscriberRow {
  id: string;
  name: string | null;
  email: string;
  status: SubscriberStatus;
  plan: string | null;
  mrr: number;
  healthScore: number | null;
  firstSeenAt: Date;
}

interface SubscriberTableProps {
  subscribers: SubscriberRow[];
}

export function SubscriberTable({ subscribers }: SubscriberTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const getHealthColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (subscribers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Aucun abonné trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MRR
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Santé
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Depuis
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscribers.map((subscriber) => (
              <tr
                key={subscriber.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/subscribers/${subscriber.id}`}
                    className="flex items-center"
                  >
                    <StatusDot status={subscriber.status} />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Link href={`/subscribers/${subscriber.id}`}>
                    <p className="font-medium text-gray-900">
                      {subscriber.name || 'Sans nom'}
                    </p>
                    <p className="text-sm text-gray-500">{subscriber.email}</p>
                  </Link>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <Link href={`/subscribers/${subscriber.id}`}>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {subscriber.plan || 'N/A'}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Link href={`/subscribers/${subscriber.id}`}>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(subscriber.mrr)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <Link href={`/subscribers/${subscriber.id}`}>
                    <span
                      className={`font-medium ${getHealthColor(
                        subscriber.healthScore
                      )}`}
                    >
                      {subscriber.healthScore !== null
                        ? `${subscriber.healthScore}/100`
                        : '-'}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <Link href={`/subscribers/${subscriber.id}`}>
                    <span className="text-gray-600">
                      {formatDate(subscriber.firstSeenAt)}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
