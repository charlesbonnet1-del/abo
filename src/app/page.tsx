import Link from 'next/link';
import {
  currentUser,
  globalMetrics,
  todayActions,
  aiInsight,
  formatCurrency,
} from '@/lib/mock-data';

function MetricCard({
  label,
  value,
  change,
  isPercentage = false,
  isCurrency = false,
}: {
  label: string;
  value: number;
  change: number;
  isPercentage?: boolean;
  isCurrency?: boolean;
}) {
  const isPositive = change >= 0;
  const formattedValue = isCurrency
    ? formatCurrency(value)
    : isPercentage
    ? `${value}%`
    : value.toString();

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
      <p
        className={`text-sm mt-1 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? '↑' : '↓'} {Math.abs(change)}%
      </p>
    </div>
  );
}

function ActionItem({
  title,
  description,
  priority,
  subscriberId,
}: {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  subscriberId: string;
}) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[priority]}`}
        >
          {priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Moyen' : 'Bas'}
        </span>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/subscribers/${subscriberId}`}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Voir
        </Link>
        <button className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
          Action
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {currentUser.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Voici ce qui se passe avec tes abonnés aujourd&apos;hui
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="MRR"
          value={globalMetrics.mrr}
          change={globalMetrics.mrrChange}
          isCurrency
        />
        <MetricCard
          label="Abonnés"
          value={globalMetrics.totalSubscribers}
          change={globalMetrics.subscribersChange}
        />
        <MetricCard
          label="Churn rate"
          value={globalMetrics.churnRate}
          change={globalMetrics.churnRateChange}
          isPercentage
        />
        <MetricCard
          label="LTV moyenne"
          value={globalMetrics.avgLtv}
          change={globalMetrics.avgLtvChange}
          isCurrency
        />
      </div>

      {/* Today's Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          À faire aujourd&apos;hui
        </h2>
        <div className="space-y-3">
          {todayActions.slice(0, 3).map((action) => (
            <ActionItem
              key={action.id}
              title={action.title}
              description={action.description}
              priority={action.priority}
              subscriberId={action.subscriberId}
            />
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {aiInsight.title} 🤖
        </h2>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
          <p className="text-gray-700 leading-relaxed">{aiInsight.message}</p>
          <Link
            href={`/subscribers/${aiInsight.subscriberId}`}
            className="inline-block mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Creuser
          </Link>
        </div>
      </div>

      {/* View All */}
      <Link
        href="/subscribers"
        className="block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Voir tous les abonnés →
      </Link>
    </div>
  );
}
