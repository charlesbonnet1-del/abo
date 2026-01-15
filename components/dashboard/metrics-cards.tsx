interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

export function MetricCard({
  label,
  value,
  change,
  isCurrency = false,
  isPercentage = false,
}: MetricCardProps) {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
      }).format(Number(value))
    : isPercentage
    ? `${value}%`
    : value;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
      {change !== undefined && (
        <p
          className={`text-sm mt-1 ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </p>
      )}
    </div>
  );
}

export function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
  );
}
