'use client';

import { NavigationDemo2 } from '@/components/nav-demo2';
import { UserMenu } from '@/components/user-menu';
import { useAgentInit } from '@/lib/hooks/useAgentInit';

// Mock user for demo purposes
const mockCurrentUser = {
  email: 'demo@abo.app',
  name: 'Demo User',
};

export default function Demo2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize agent configs for new users
  useAgentInit();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationDemo2 />

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600">Autopilot actif</span>
        </div>
        <UserMenu email={mockCurrentUser.email} name={mockCurrentUser.name} />
      </header>

      {/* Main content */}
      <main className="pt-16 pb-20 md:pb-6 md:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
