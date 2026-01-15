'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  subscribers,
  getStatusEmoji,
  getStatusLabel,
  getHealthColor,
  formatCurrency,
  formatDate,
  SubscriberStatus,
} from '@/lib/mock-data';

type FilterType = 'all' | SubscriberStatus;

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'at_risk', label: 'À risque' },
  { value: 'trial', label: 'Trial' },
  { value: 'churned', label: 'Churnés' },
];

export default function SubscribersPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredSubscribers =
    activeFilter === 'all'
      ? subscribers
      : subscribers.filter((s) => s.status === activeFilter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abonnés</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            Filtres
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.value
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.label}
            {filter.value !== 'all' && (
              <span className="ml-1 opacity-70">
                ({subscribers.filter((s) => s.status === filter.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Action suggérée
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubscribers.map((subscriber) => {
                const latestAiComment = subscriber.events.find(
                  (e) => e.type === 'ai_comment'
                );
                return (
                  <tr
                    key={subscriber.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/subscribers/${subscriber.id}`}
                        className="flex items-center"
                      >
                        <span className="text-lg" title={getStatusLabel(subscriber.status)}>
                          {getStatusEmoji(subscriber.status)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/subscribers/${subscriber.id}`}>
                        <p className="font-medium text-gray-900">
                          {subscriber.name}
                        </p>
                        <p className="text-sm text-gray-500">{subscriber.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <Link href={`/subscribers/${subscriber.id}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {subscriber.plan}
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
                            subscriber.health
                          )}`}
                        >
                          {subscriber.health}/100
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Link href={`/subscribers/${subscriber.id}`}>
                        <span className="text-gray-600">
                          {formatDate(subscriber.since)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell max-w-xs">
                      <Link href={`/subscribers/${subscriber.id}`}>
                        {latestAiComment && (
                          <p className="text-sm text-gray-500 truncate italic">
                            {latestAiComment.message}
                          </p>
                        )}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        {filteredSubscribers.length} abonné{filteredSubscribers.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
