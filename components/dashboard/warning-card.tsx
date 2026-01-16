'use client';

import Link from 'next/link';
import { WarningGroup } from '@/lib/mock-data';

interface WarningCardProps {
  warning: WarningGroup;
}

const severityConfig = {
  critical: {
    icon: '🔴',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  warning: {
    icon: '🟡',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  info: {
    icon: '🔵',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  positive: {
    icon: '🟢',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
};

export function WarningCard({ warning }: WarningCardProps) {
  const config = severityConfig[warning.severity];

  return (
    <div
      className={`rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${config.textColor}`}>{warning.title}</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700">{warning.userCount} users</p>
            {warning.mrrAtRisk && (
              <p className="text-sm text-gray-600">
                {warning.mrrAtRisk}€ MRR a risque
              </p>
            )}
            {!warning.mrrAtRisk && warning.description && (
              <p className="text-sm text-gray-600">{warning.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/users?warning=${warning.type}`}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
        >
          Voir le groupe
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {warning.automationId ? (
          <Link
            href={`/automations/${warning.automationId}`}
            className={`text-sm font-medium ${config.textColor} hover:underline`}
          >
            Lancer automation
          </Link>
        ) : (
          <button className={`text-sm font-medium ${config.textColor} hover:underline text-left`}>
            {warning.suggestedAction}
          </button>
        )}
      </div>
    </div>
  );
}
