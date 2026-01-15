import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { Navigation } from '@/components/nav';
import { UserMenu } from '@/components/user-menu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUser = await getUser();

  // Redirect to login if not authenticated or Supabase not configured
  if (!supabaseUser) {
    redirect('/login');
  }

  // Try to get user from database
  let user: { email: string; name: string | null } | null = null;

  try {
    // Dynamic import to avoid module-level errors
    const prisma = (await import('@/lib/prisma')).default;

    const metadata = supabaseUser.user_metadata || {};

    user = await prisma.user.upsert({
      where: { email: supabaseUser.email! },
      update: {},
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: metadata.full_name || metadata.name,
        firstName: metadata.first_name,
        lastName: metadata.last_name,
        company: metadata.company,
        jobPosition: metadata.job_position,
      },
      select: {
        email: true,
        name: true,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    // If database is not configured, redirect to login with error
    redirect('/login?error=database_not_configured');
  }

  if (!user) {
    redirect('/login');
  }

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
