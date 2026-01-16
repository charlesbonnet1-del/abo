'use client';

export type KpiType = 'mrr' | 'churn' | 'active_users' | 'trial_conversion';

interface KpiCardProps {
  type: KpiType;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  onClick?: () => void;
}

export function KpiCard({
  type,
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  onClick,
}: KpiCardProps) {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const typeConfig: Record<KpiType, { color: string; bgColor: string }> = {
    mrr: { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    churn: { color: 'text-red-600', bgColor: 'bg-red-50' },
    active_users: { color: 'text-blue-600', bgColor: 'bg-blue-50' },
    trial_conversion: { color: 'text-violet-600', bgColor: 'bg-violet-50' },
  };

  const config = typeConfig[type];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${config.color}`}>{value}</p>
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <span className="text-lg">{icon}</span>
          </div>
        )}
      </div>

      {change && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${changeColors[changeType]}`}>
            {change}
          </span>
          <span className="text-xs text-gray-400">vs mois precedent</span>
        </div>
      )}

      {/* Clickable hint */}
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
        <span>Voir le detail</span>
        <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
