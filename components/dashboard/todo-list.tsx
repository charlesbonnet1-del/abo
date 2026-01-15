import Link from 'next/link';
import { ActionType } from '@prisma/client';
import { Button } from '@/components/ui/button';

interface TodoItem {
  id: string;
  type: ActionType;
  subscriberId: string;
  subscriber: {
    name: string | null;
    email: string;
  };
  dueAt: Date | null;
}

const actionLabels: Record<ActionType, { title: string; priority: 'high' | 'medium' | 'low' }> = {
  REACH_OUT: { title: 'Contacter', priority: 'medium' },
  OFFER_DISCOUNT: { title: 'Proposer réduction', priority: 'low' },
  UPDATE_CARD: { title: 'Mettre à jour CB', priority: 'high' },
  CONVERT_TRIAL: { title: 'Convertir trial', priority: 'medium' },
  CELEBRATE_ANNIVERSARY: { title: 'Anniversaire', priority: 'low' },
};

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export function TodoList({ actions }: { actions: TodoItem[] }) {
  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          À faire aujourd&apos;hui
        </h2>
        <p className="text-gray-500 text-sm">
          Aucune action en attente. Bravo !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          À faire aujourd&apos;hui
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {actions.map((action) => {
          const config = actionLabels[action.type];
          return (
            <div
              key={action.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    priorityColors[config.priority]
                  }`}
                >
                  {config.priority === 'high'
                    ? 'Urgent'
                    : config.priority === 'medium'
                    ? 'Moyen'
                    : 'Bas'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{config.title}</p>
                  <p className="text-sm text-gray-500">
                    {action.subscriber.name || action.subscriber.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/subscribers/${action.subscriberId}`}>
                  <Button variant="ghost" size="sm">
                    Voir
                  </Button>
                </Link>
                <Button size="sm">Action</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
