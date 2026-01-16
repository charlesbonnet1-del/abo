interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeLabel, icon }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <span
            className={`text-sm font-medium ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {isPositive && '+'}
            {change}%
            {changeLabel && <span className="text-gray-400 ml-1">{changeLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
