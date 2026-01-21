'use client';

import { useEffect, useState } from 'react';

interface TimeAgoProps {
  date: string | Date | null;
  className?: string;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'a l\'instant';
  } else if (diffMinutes < 60) {
    return `il y a ${diffMinutes}min`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  } else if (diffDays < 7) {
    return `il y a ${diffDays}j`;
  } else if (diffWeeks < 4) {
    return `il y a ${diffWeeks} sem`;
  } else if (diffMonths < 12) {
    return `il y a ${diffMonths} mois`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

export function TimeAgo({ date, className = '' }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!date) return;

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setTimeAgo(getTimeAgo(dateObj));

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(dateObj));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  if (!date) {
    return <span className={`text-gray-400 ${className}`}>-</span>;
  }

  return (
    <span className={`text-gray-500 ${className}`} title={new Date(date).toLocaleString('fr-FR')}>
      {timeAgo}
    </span>
  );
}

export function formatDate(date: string | Date | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
