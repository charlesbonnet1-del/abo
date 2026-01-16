'use client';

import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  label?: string;
}

export function ExportButton({
  data,
  filename,
  variant = 'outline',
  size = 'sm',
  label = 'Exporter',
}: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Format date for filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.xlsx`;

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    // Download file
    XLSX.writeFile(wb, fullFilename);
  };

  const baseStyles = 'inline-flex items-center gap-2 font-medium rounded-lg transition-colors';
  const sizeStyles = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base';
  const variantStyles = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  };

  return (
    <button
      onClick={handleExport}
      className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {label}
    </button>
  );
}

// Helper function to format user data for export
interface ExportableUser {
  email: string;
  name: string;
  company?: string | null;
  plan: string;
  mrr: number;
  status: string;
  healthScore: number;
  lastSeenAt: string;
  createdAt: string;
  tags?: string[];
}

export function formatUsersForExport<T extends ExportableUser>(users: T[]): Record<string, unknown>[] {
  return users.map(user => ({
    'Email': user.email,
    'Nom': user.name,
    'Entreprise': user.company || '',
    'Plan': user.plan,
    'MRR': user.mrr,
    'Status': user.status,
    'Health Score': user.healthScore,
    'Derniere activite': user.lastSeenAt,
    'Date inscription': user.createdAt,
    'Tags': user.tags?.join(', ') || '',
  }));
}
