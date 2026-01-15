import { EventType, EventSource } from '@prisma/client';

interface TimelineEvent {
  id: string;
  type: EventType;
  source: EventSource;
  data: unknown;
  aiComment: string | null;
  occurredAt: Date;
}

interface TimelineProps {
  events: TimelineEvent[];
}

const eventConfig: Record<
  EventType,
  { icon: string; bgColor: string; textColor: string; label: string }
> = {
  PAYMENT_SUCCESS: {
    icon: '💳',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    label: 'Paiement réussi',
  },
  PAYMENT_FAILED: {
    icon: '❌',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    label: 'Paiement échoué',
  },
  SUBSCRIPTION_CREATED: {
    icon: '🎉',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    label: 'Abonnement créé',
  },
  SUBSCRIPTION_UPDATED: {
    icon: '📈',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    label: 'Abonnement modifié',
  },
  SUBSCRIPTION_CANCELED: {
    icon: '🚫',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    label: 'Abonnement annulé',
  },
  TRIAL_STARTED: {
    icon: '🆓',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    label: 'Trial démarré',
  },
  TRIAL_ENDED: {
    icon: '⏰',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    label: 'Trial terminé',
  },
  NOTE_ADDED: {
    icon: '📝',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    label: 'Note ajoutée',
  },
  AI_INSIGHT: {
    icon: '🤖',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    label: 'Insight IA',
  },
};

export function Timeline({ events }: TimelineProps) {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);

  const getEventDescription = (event: TimelineEvent): string => {
    const data = event.data as Record<string, unknown> | null;

    switch (event.type) {
      case 'PAYMENT_SUCCESS':
        return `Paiement de ${formatCurrency((data?.amount as number) || 0)}`;
      case 'PAYMENT_FAILED':
        return `Échec paiement${data?.reason ? ` - ${data.reason}` : ''}`;
      case 'SUBSCRIPTION_CREATED':
        return data?.plan ? `Plan: ${data.plan}` : 'Nouvel abonnement';
      case 'SUBSCRIPTION_UPDATED':
        return data?.plan ? `Nouveau plan: ${data.plan}` : 'Mise à jour';
      case 'SUBSCRIPTION_CANCELED':
        return 'Abonnement annulé';
      case 'TRIAL_STARTED':
        return 'Période d\'essai démarrée';
      case 'TRIAL_ENDED':
        return 'Période d\'essai terminée';
      case 'NOTE_ADDED':
        return (data?.content as string) || 'Note ajoutée';
      case 'AI_INSIGHT':
        return event.aiComment || 'Analyse IA';
      default:
        return '';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-gray-500 text-sm">Aucun événement</div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const config = eventConfig[event.type];
        return (
          <div key={event.id} className="flex gap-4">
            <div
              className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">{formatDate(event.occurredAt)}</p>
              <p className={`font-medium ${config.textColor}`}>{config.label}</p>
              <p
                className={`text-sm ${
                  event.type === 'AI_INSIGHT' ? 'italic text-indigo-600' : 'text-gray-600'
                }`}
              >
                {getEventDescription(event)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
