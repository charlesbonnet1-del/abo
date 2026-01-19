'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { mockUsers, type UserStatus } from '@/lib/mock-data';
import { StatusDot } from '@/components/ui/badge';
import { HealthBar } from '@/components/ui/health-bar';
import { Avatar } from '@/components/ui/avatar';

type FilterValue = '' | UserStatus;

// Mock AI actions for users
const userAiActions: Record<string, { action: string; agent: string; agentColor: string; timestamp: string }> = {
  '1': { action: 'Email de bienvenue envoye', agent: 'Conversion', agentColor: 'blue', timestamp: 'Il y a 2j' },
  '2': { action: 'Offre upgrade proposee', agent: 'Conversion', agentColor: 'blue', timestamp: 'Il y a 1h' },
  '3': { action: 'Risque detecte - email support', agent: 'Retention', agentColor: 'emerald', timestamp: 'Il y a 30 min' },
  '4': { action: 'Paiement recupere', agent: 'Recovery', agentColor: 'amber', timestamp: 'Il y a 3h' },
  '5': { action: 'Email nurturing envoye', agent: 'Conversion', agentColor: 'blue', timestamp: 'Hier' },
  '6': { action: 'Appel de retention programme', agent: 'Retention', agentColor: 'emerald', timestamp: 'Il y a 2j' },
  '7': { action: 'Relance paiement envoyee', agent: 'Recovery', agentColor: 'amber', timestamp: 'Il y a 5h' },
  '8': { action: 'Aucune action recente', agent: '', agentColor: '', timestamp: '' },
  '9': { action: 'Offre trial prolonge', agent: 'Conversion', agentColor: 'blue', timestamp: 'Hier' },
  '10': { action: 'Win-back tente', agent: 'Retention', agentColor: 'emerald', timestamp: 'Il y a 1 semaine' },
};

const agentBadgeColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
};

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
    { value: 'at_risk', label: 'A risque', count: countByStatus.at_risk },
    { value: 'churned', label: 'Churnes', count: countByStatus.churned },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Suivi des interactions agents</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-70">({filter.count})</span>
            </button>
          );
        })}
      </div>

      {/* Simplified Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider w-24 hidden md:table-cell">
                  Health
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Derniere Action IA
                </th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const aiAction = userAiActions[user.id] || { action: 'Aucune action', agent: '', agentColor: '', timestamp: '' };
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/demo2/users/${user.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <StatusDot status={user.status} />
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <HealthBar score={user.healthScore} />
                    </td>
                    <td className="py-3 px-4">
                      {aiAction.agent ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${agentBadgeColors[aiAction.agentColor]}`}>
                              {aiAction.agent}
                            </span>
                            <span className="text-xs text-slate-400">{aiAction.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600">{aiAction.action}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Aucune action recente</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/demo2/users/${user.id}`}
                        className="text-slate-400 hover:text-slate-600"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count */}
      <p className="mt-4 text-sm text-slate-500 text-center">
        {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
