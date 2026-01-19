import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getUser } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getUser();

  if (!supabase || !user) {
    redirect('/login');
  }

  // Get user's Stripe connection status and subscriber count
  const { data: userData } = await supabase
    .from('user')
    .select('stripeaccountid, stripeconnectedat')
    .eq('id', user.id)
    .single();

  const isStripeConnected = !!userData?.stripeaccountid;

  // Get subscriber count if connected
  let subscriberCount = 0;
  let totalMrr = 0;
  if (isStripeConnected) {
    const { count } = await supabase
      .from('subscriber')
      .select('*', { count: 'exact', head: true })
      .eq('userid', user.id);

    subscriberCount = count || 0;

    const { data: mrrData } = await supabase
      .from('subscriber')
      .select('mrr')
      .eq('userid', user.id)
      .in('status', ['active', 'trialing']);

    totalMrr = mrrData?.reduce((sum, s) => sum + (s.mrr || 0), 0) || 0;
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
        {isStripeConnected ? (
          <>
            {/* Stats when connected */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Stripe</p>
                </div>
                <p className="text-2xl font-bold text-green-600">Connecte</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Subscribers</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{subscriberCount}</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">MRR</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{(totalMrr / 100).toFixed(2)}€</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/settings"
                  className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Parametres
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Gerer Stripe, synchroniser les donnees
                  </p>
                </Link>

                <Link
                  href="/demo"
                  className="p-6 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Voir la demo
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Explorer toutes les fonctionnalites avec des donnees de demo
                  </p>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Not connected state */
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
                <Link
                  href="/settings"
                  className="inline-block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connecter Stripe
                </Link>
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
        )}
      </main>
    </div>
  );
}
