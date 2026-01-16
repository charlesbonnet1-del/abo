'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockAlerts, getUserById, formatDate } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { SeverityBadge } from '@/components/ui/badge';

type FilterValue = 'all' | 'unseen' | 'critical' | 'warning' | 'info';

const alertTypeConfig: Record<string, { icon: string; bgColor: string; textColor: string; borderColor: string }> = {
  payment_failed: {
    icon: '❌',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  trial_ending: {
    icon: '⏰',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  churn_risk: {
    icon: '⚠️',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  card_expiring: {
    icon: '💳',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  milestone: {
    icon: '🎉',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  limit_approaching: {
    icon: '📊',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [localAlerts, setLocalAlerts] = useState(mockAlerts);

  // Filter alerts based on selected filter
  const filteredAlerts = useMemo(() => {
    return localAlerts.filter((alert) => {
      switch (filter) {
        case 'unseen':
          return !alert.seen;
        case 'critical':
          return alert.severity === 'critical';
        case 'warning':
          return alert.severity === 'warning';
        case 'info':
          return alert.severity === 'info';
        default:
          return true;
      }
    });
  }, [localAlerts, filter]);

  // Get counts for filters
  const counts = useMemo(() => ({
    all: localAlerts.length,
    unseen: localAlerts.filter((a) => !a.seen).length,
    critical: localAlerts.filter((a) => a.severity === 'critical').length,
    warning: localAlerts.filter((a) => a.severity === 'warning').length,
    info: localAlerts.filter((a) => a.severity === 'info').length,
  }), [localAlerts]);

  const filters: { value: FilterValue; label: string; count: number }[] = [
    { value: 'all', label: 'Toutes', count: counts.all },
    { value: 'unseen', label: 'Non lues', count: counts.unseen },
    { value: 'critical', label: 'Critiques', count: counts.critical },
    { value: 'warning', label: 'Warnings', count: counts.warning },
    { value: 'info', label: 'Info', count: counts.info },
  ];

  const markAsSeen = (alertId: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, seen: true } : a))
    );
  };

  const markAllAsSeen = () => {
    setLocalAlerts((prev) => prev.map((a) => ({ ...a, seen: true })));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          {counts.unseen > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {counts.unseen} nouvelle{counts.unseen > 1 ? 's' : ''} alerte{counts.unseen > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {counts.unseen > 0 && (
          <button
            onClick={markAllAsSeen}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => {
          const isActive = f.value === filter;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-70">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">🔔</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune alerte
          </h2>
          <p className="text-gray-500">
            {filter === 'all'
              ? "Tu recevras des alertes quand des événements importants se produiront."
              : "Aucune alerte ne correspond à ce filtre."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = alertTypeConfig[alert.type] || alertTypeConfig.milestone;
            const user = getUserById(alert.userId);

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  alert.seen
                    ? 'bg-white border-gray-200'
                    : `${config.bgColor} ${config.borderColor}`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.seen ? 'bg-gray-100' : 'bg-white/50'
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-gray-500">{formatDate(alert.createdAt)}</span>
                    </div>

                    <p
                      className={`font-medium ${
                        alert.seen ? 'text-gray-700' : config.textColor
                      }`}
                    >
                      {alert.message.split('—')[0].trim()}
                    </p>

                    {user && (
                      <p className="text-sm text-gray-500 mt-1">
                        {user.email}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                      <Link
                        href={`/users/${alert.userId}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Voir le user
                      </Link>
                      {!alert.seen && (
                        <button
                          onClick={() => markAsSeen(alert.id)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        Envoyer email
                      </button>
                    </div>
                  </div>

                  {/* Unseen indicator */}
                  {!alert.seen && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
