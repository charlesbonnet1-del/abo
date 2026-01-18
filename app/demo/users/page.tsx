'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { mockUsers, type UserStatus, formatDate } from '@/lib/mock-data';
import { StatusDot, PlanBadge } from '@/components/ui/badge';
import { HealthBar } from '@/components/ui/health-bar';
import { Avatar } from '@/components/ui/avatar';
import { ExportButton, formatUsersForExport } from '@/components/export';

type FilterValue = '' | UserStatus;

export default function UsersPage() {
  const [statusFilter, setStatusFilter] = useState<FilterValue>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on status and search
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesStatus = statusFilter === '' || user.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  // Get counts for filters
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      all: mockUsers.length,
      freemium: 0,
      trial: 0,
      active: 0,
      at_risk: 0,
      churned: 0,
    };
    mockUsers.forEach((user) => {
      counts[user.status]++;
    });
    return counts;
  }, []);

  const filters: { value: FilterValue; label: string; count: number }[] = [
    { value: '', label: 'Tous', count: countByStatus.all },
    { value: 'freemium', label: 'Freemium', count: countByStatus.freemium },
    { value: 'trial', label: 'Trial', count: countByStatus.trial },
    { value: 'active', label: 'Actifs', count: countByStatus.active },
    { value: 'at_risk', label: 'À risque', count: countByStatus.at_risk },
    { value: 'churned', label: 'Churnés', count: countByStatus.churned },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
          <ExportButton
            data={formatUsersForExport(filteredUsers)}
            filename={statusFilter ? `users_${statusFilter}` : 'users'}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((filter) => {
          const isActive = filter.value === statusFilter;
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-70">({filter.count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  MRR
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">
                  Health
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Dernière activité
                </th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">

                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/users/${user.id}`}
                >
                  <td className="py-3 px-4">
                    <StatusDot status={user.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 sm:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <PlanBadge plan={user.plan} />
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium hidden lg:table-cell">
                    {user.mrr > 0 ? `${user.mrr}€` : '—'}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <HealthBar score={user.healthScore} />
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm hidden lg:table-cell">
                    {formatDate(user.lastSeenAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
