import { HTMLAttributes } from 'react';
import { SubscriberStatus } from '@prisma/client';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: SubscriberStatus }) {
  const config: Record<SubscriberStatus, { variant: BadgeProps['variant']; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Actif' },
    AT_RISK: { variant: 'warning', label: 'À risque' },
    TRIAL: { variant: 'info', label: 'Trial' },
    CHURNED: { variant: 'default', label: 'Churné' },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusDot({ status }: { status: SubscriberStatus }) {
  const colors: Record<SubscriberStatus, string> = {
    ACTIVE: 'bg-green-500',
    AT_RISK: 'bg-yellow-500',
    TRIAL: 'bg-blue-500',
    CHURNED: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}
