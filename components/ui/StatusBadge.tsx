interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
  trialing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Essai' },
  past_due: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En retard' },
  canceled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annule' },
  paused: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pause' },
  none: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Aucun' },
  // Invoice statuses
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paye' },
  open: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En attente' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Echoue' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Brouillon' },
  // Action statuses
  pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approuve' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejete' },
  executed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Execute' },
  // Communication statuses
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Envoye' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Livre' },
  opened: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ouvert' },
  clicked: { bg: 'bg-green-100', text: 'text-green-700', label: 'Clique' },
  bounced: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rebondi' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: status };

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
