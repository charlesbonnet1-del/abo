import Link from 'next/link';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { AlertType } from '@prisma/client';
import { Card } from '@/components/ui/card';

const alertConfig: Record<
  AlertType,
  { icon: string; bgColor: string; textColor: string }
> = {
  PAYMENT_FAILED: {
    icon: '❌',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  TRIAL_ENDING: {
    icon: '⏰',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  ANNIVERSARY: {
    icon: '🎂',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  CHURN_RISK: {
    icon: '⚠️',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  CARD_EXPIRING: {
    icon: '💳',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  MILESTONE: {
    icon: '🎉',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
};

export default async function AlertsPage() {
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user) {
    return null;
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: user.id },
    orderBy: [
      { seen: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const unseenCount = alerts.filter((a) => !a.seen).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          {unseenCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unseenCount} nouvelle{unseenCount > 1 ? 's' : ''} alerte
              {unseenCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">🔔</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune alerte
          </h2>
          <p className="text-gray-500">
            Tu recevras des alertes quand des événements importants se produiront.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type];
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-colors ${
                  alert.seen
                    ? 'bg-white border-gray-200'
                    : `${config.bgColor} border-transparent`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.seen ? 'bg-gray-100' : config.bgColor
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-medium ${
                          alert.seen ? 'text-gray-700' : config.textColor
                        }`}
                      >
                        {alert.message}
                      </p>
                      {!alert.seen && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(alert.createdAt)}
                    </p>
                    {alert.subscriberId && (
                      <Link
                        href={`/subscribers/${alert.subscriberId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                      >
                        Voir le client →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
