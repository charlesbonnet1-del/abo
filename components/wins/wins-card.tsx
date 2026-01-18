'use client';

interface WinsCardProps {
  icon: string;
  title: string;
  mainValue: string;
  subValue: string;
  color: 'green' | 'blue' | 'purple' | 'amber' | 'cyan';
}

const colorClasses = {
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
};

const iconBgClasses = {
  green: 'bg-emerald-100',
  blue: 'bg-blue-100',
  purple: 'bg-purple-100',
  amber: 'bg-amber-100',
  cyan: 'bg-cyan-100',
};

export function WinsCard({ icon, title, mainValue, subValue, color }: WinsCardProps) {
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBgClasses[color]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{mainValue}</p>
          <p className="text-xs mt-1 opacity-70">{subValue}</p>
        </div>
      </div>
    </div>
  );
}
