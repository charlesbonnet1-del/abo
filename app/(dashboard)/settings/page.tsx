import Link from 'next/link';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchParams {
  success?: string;
  error?: string;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user) {
    return null;
  }

  const isStripeConnected = !!user.stripeAccountId;

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      {/* Success/Error messages */}
      {params.success === 'stripe_connected' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Stripe connecté avec succès ! Synchronisation des données en cours...
        </div>
      )}
      {params.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erreur : {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Stripe Connection */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-indigo-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stripe</h2>
              {isStripeConnected ? (
                <>
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Connecté
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {user.stripeAccountId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Connecté le {formatDate(user.stripeConnectedAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Connecte ton compte Stripe pour synchroniser tes abonnés
                </p>
              )}
            </div>
          </div>
          <div>
            {isStripeConnected ? (
              <Button variant="secondary" size="sm" disabled>
                Déconnecter
              </Button>
            ) : (
              <Link href="/api/stripe/connect">
                <Button size="sm">Connecter</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compte</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          {user.name && (
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium text-gray-900">{user.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Membre depuis</p>
            <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Placeholder sections */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-sm text-gray-500">
          Configuration des notifications à venir...
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Webhooks</h2>
        <p className="text-sm text-gray-500 mb-3">
          URL pour recevoir les événements Stripe en temps réel :
        </p>
        <code className="block p-3 bg-gray-50 rounded-lg text-sm text-gray-700 break-all">
          {process.env.NEXT_PUBLIC_APP_URL || 'https://ton-domaine.com'}
          /api/stripe/webhooks
        </code>
      </Card>
    </div>
  );
}
