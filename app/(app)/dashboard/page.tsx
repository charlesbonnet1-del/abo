import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getUser } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getUser();

  if (!supabase || !user) {
    redirect('/login');
  }

  async function signOut() {
    'use server';
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
            Abo
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Deconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue sur Abo
          </h1>
          <p className="text-gray-600 mb-8">
            Connecte avec {user.email}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Prochaine etape
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Connecte ton compte Stripe pour commencer a synchroniser tes abonnes.
              </p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                Connecter Stripe
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Explorer la demo
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Decouvre toutes les fonctionnalites d&apos;Abo avec des donnees de demonstration.
              </p>
              <Link
                href="/demo"
                className="inline-block px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Voir la demo
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
