interface HealthBarProps {
  score: number; // 0-100
  showLabel?: boolean;
}

export function HealthBar({ score, showLabel = true }: HealthBarProps) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 min-w-[2.5rem] text-right">
          {score}
        </span>
      )}
    </div>
  );
}
