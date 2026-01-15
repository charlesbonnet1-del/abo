import Link from 'next/link';

export default function ConfigPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <span className="text-6xl mb-4">⚙️</span>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration</h1>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Cette fonctionnalité arrive bientôt ! Tu pourras personnaliser ton espace
        Abo et configurer tes intégrations.
      </p>
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 max-w-md">
        <p className="text-sm text-violet-700">
          <strong>Bientôt disponible :</strong> Connexion Stripe, configuration des
          scores de santé, templates d&apos;emails, et webhooks.
        </p>
      </div>
      <Link
        href="/"
        className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
