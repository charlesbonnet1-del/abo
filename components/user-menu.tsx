'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UserMenuProps {
  email: string;
  name?: string | null;
}

export function UserMenu({ email, name }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">{name || email}</p>
          {name && <p className="text-xs text-gray-500">{email}</p>}
        </div>
        <svg
          className="w-4 h-4 text-gray-400 hidden sm:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
              <p className="text-sm font-medium text-gray-900">{name || email}</p>
              {name && <p className="text-xs text-gray-500">{email}</p>}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
