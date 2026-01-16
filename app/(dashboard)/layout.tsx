import { Navigation } from '@/components/nav';
import { UserMenu } from '@/components/user-menu';

// Mock user for demo purposes
const mockCurrentUser = {
  email: 'demo@abo.app',
  name: 'Demo User',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-end px-6">
        <UserMenu email={mockCurrentUser.email} name={mockCurrentUser.name} />
      </header>

      {/* Main content */}
      <main className="pt-16 pb-20 md:pb-6 md:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
