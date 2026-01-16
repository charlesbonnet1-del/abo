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
    accentColor: 'bg-red-500',
  },
  warning: {
    icon: '🟡',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    accentColor: 'bg-amber-500',
  },
  info: {
    icon: '🔵',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    accentColor: 'bg-blue-500',
  },
  positive: {
    icon: '🟢',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    accentColor: 'bg-green-500',
  },
};

export function WarningCard({ warning }: WarningCardProps) {
  const config = severityConfig[warning.severity];
  const { automationStatus, suggestedActions } = warning;
  const hasCoverage = automationStatus.coveredCount > 0;
  const coveragePercent = warning.userCount > 0
    ? Math.round((automationStatus.coveredCount / warning.userCount) * 100)
    : 0;

  return (
    <div
      className={`rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${config.textColor}`}>{warning.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-700">{warning.userCount} users</p>
            {warning.mrrAtRisk && (
              <span className="text-sm text-gray-500">• {warning.mrrAtRisk}€ a risque</span>
            )}
          </div>
        </div>
      </div>

      {/* Automation Status Section */}
      <div className="mt-4 bg-white/60 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Couverture automations</span>
          <span className="font-medium">{coveragePercent}%</span>
        </div>

        {/* Coverage Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${hasCoverage ? 'bg-green-500' : 'bg-gray-300'}`}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-600">{automationStatus.coveredCount} couverts</span>
          {automationStatus.uncoveredCount > 0 && (
            <span className="text-gray-500">{automationStatus.uncoveredCount} non couverts</span>
          )}
        </div>
      </div>

      {/* Automation Details - What's Running */}
      {hasCoverage && automationStatus.details.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">En cours</p>
          {automationStatus.details.map((detail, idx) => (
            <div key={idx} className="bg-white/60 rounded-lg p-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">⚡</span>
                <span className="font-medium text-gray-800">{detail.automationName}</span>
                <span className="text-gray-400 text-xs">({detail.userCount})</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">{detail.currentStep}</p>
              {detail.engagement && (
                <p className="text-xs text-indigo-600 mt-0.5 ml-6">{detail.engagement}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suggested Actions - When Not Covered */}
      {automationStatus.uncoveredCount > 0 && suggestedActions.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {hasCoverage ? 'Actions suggerees' : 'Aucune automation active'}
          </p>
          {suggestedActions.map((action, idx) => (
            <Link
              key={idx}
              href={
                action.type === 'activate_automation' && action.automationId
                  ? `/automations/${action.automationId}`
                  : action.type === 'view_templates'
                  ? '/automations?tab=templates'
                  : '/automations/new'
              }
              className="flex items-center gap-2 bg-white rounded-lg p-2 text-sm hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <span className="text-amber-500">
                {action.type === 'activate_automation' ? '▶️' :
                 action.type === 'send_campaign' ? '📧' : '📋'}
              </span>
              <span className="text-gray-700">{action.label}</span>
              <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* View Group Link */}
      <div className="mt-4 pt-3 border-t border-gray-200/50">
        <Link
          href={`/users?warning=${warning.type}`}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
        >
          Voir les {warning.userCount} users
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
