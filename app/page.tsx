import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Abo
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Creer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Ton copilote
            <span className="text-indigo-600"> abonnements</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Le CRM concu pour les solopreneurs et createurs de SaaS.
            Connecte Stripe, comprends tes users, automatise les actions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 text-lg font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Voir la demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automations intelligentes</h3>
            <p className="text-gray-600 text-sm">
              Cree des sequences automatisees pour onboarder, relancer ou retenir tes clients.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics clairs</h3>
            <p className="text-gray-600 text-sm">
              MRR, churn, LTV, cohortes... Toutes les metriques SaaS en un coup d&apos;oeil.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Segmentation avancee</h3>
            <p className="text-gray-600 text-sm">
              Cree des segments dynamiques pour cibler les bons users au bon moment.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-24 p-8 bg-indigo-600 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pret a booster ton SaaS ?
          </h2>
          <p className="text-indigo-100 mb-6">
            Commence gratuitement. Pas de carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 text-base font-medium text-indigo-600 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              Creer un compte
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 text-base font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Explorer la demo
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>2024 Abo. Fait avec amour pour les solopreneurs.</p>
        </div>
      </footer>
    </div>
  );
}
