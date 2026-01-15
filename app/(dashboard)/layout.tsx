import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Navigation } from '@/components/nav';
import { UserMenu } from '@/components/user-menu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    redirect('/login');
  }

  // Get or create user in database
  const user = await prisma.user.upsert({
    where: { email: supabaseUser.email! },
    update: {},
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-end px-6">
        <UserMenu email={user.email} name={user.name} />
      </header>

      {/* Main content */}
      <main className="pt-16 pb-20 md:pb-6 md:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
