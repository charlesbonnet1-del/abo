import { HTMLAttributes } from 'react';
import type { UserStatus, PlanType } from '@/lib/mock-data';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
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
    gray: 'bg-gray-100 text-gray-500',
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

export function StatusBadge({ status }: { status: UserStatus }) {
  const config: Record<UserStatus, { variant: BadgeProps['variant']; label: string }> = {
    freemium: { variant: 'gray', label: 'Freemium' },
    trial: { variant: 'warning', label: 'Trial' },
    active: { variant: 'success', label: 'Actif' },
    at_risk: { variant: 'danger', label: 'À risque' },
    churned: { variant: 'default', label: 'Churné' },
  };

  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PlanBadge({ plan }: { plan: PlanType }) {
  const planNames: Record<PlanType, string> = {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
    team: 'Team',
    scale: 'Scale',
  };

  const variant = plan === 'free' ? 'gray' : plan === 'scale' ? 'info' : 'default';
  return <Badge variant={variant}>{planNames[plan]}</Badge>;
}

export function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'critical' }) {
  const config = {
    info: { label: 'INFO', variant: 'info' as const },
    warning: { label: 'WARNING', variant: 'warning' as const },
    critical: { label: 'CRITIQUE', variant: 'danger' as const },
  };

  const { label, variant } = config[severity];
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusDot({ status }: { status: UserStatus }) {
  const colors: Record<UserStatus, string> = {
    freemium: 'bg-gray-400',
    trial: 'bg-yellow-500',
    active: 'bg-green-500',
    at_risk: 'bg-orange-500',
    churned: 'bg-red-500',
  };

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}
