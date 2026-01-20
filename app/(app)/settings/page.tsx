'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserData {
  stripe_account_id: string | null;
  stripe_account_name: string | null;
  stripe_connected: boolean;
  last_sync_at: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/login');
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser({ id: authUser.id, email: authUser.email || '' });

    // Get user's Stripe connection status
    const { data: userDataResult, error } = await supabase
      .from('user')
      .select('stripe_account_id, stripe_account_name, stripe_connected, last_sync_at')
      .eq('id', authUser.id)
      .single();

    console.log('Fetched user data:', userDataResult, 'Error:', error);

    if (userDataResult) {
      setUserData(userDataResult);

      // Get subscriber count if connected
      if (userDataResult.stripe_connected) {
        const { count } = await supabase
          .from('subscriber')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);
        setSubscriberCount(count || 0);
      }
    }

    setLoading(false);
  }, [router]);

  // Initial load and URL params handling
  useEffect(() => {
    // Check URL params first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const error = params.get('error');
      const autoSync = params.get('auto_sync');

      if (success) {
        setShowSuccess(true);
      }
      if (error) {
        setShowError(error);
      }

      // Clean URL
      if (params.toString()) {
        window.history.replaceState({}, '', '/settings');
      }

      // Fetch data - if success param is present, wait a bit for DB to be updated
      if (success) {
        // Small delay to ensure DB has been updated by callback
        setTimeout(() => {
          fetchData();
          if (autoSync === 'true') {
            // Trigger auto-sync after a short delay
            setTimeout(() => handleSync(), 500);
          }
        }, 300);
      } else {
        fetchData();
      }
    } else {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/stripe/sync', {
        method: 'POST',
      });
      const result = await response.json();

      if (response.ok) {
        setSyncMessage({ type: 'success', text: `${result.synced || 0} subscribers synchronises` });
        await fetchData(); // Refresh data
      } else {
        setSyncMessage({ type: 'error', text: result.error || 'Erreur lors de la synchronisation' });
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const supabase = createClient();
    if (!supabase || !user) return;

    await supabase
      .from('user')
      .update({
        stripe_account_id: null,
        stripe_account_name: null,
        stripe_connected: false,
        stripe_access_token: null,
        last_sync_at: null,
      })
      .eq('id', user.id);

    setUserData(null);
    setSubscriberCount(0);
    setShowSuccess(false);
    router.refresh();
  };

  // Check connection status - use stripe_connected OR stripe_account_id as fallback
  const isConnected = userData?.stripe_connected === true || !!userData?.stripe_account_id;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
              Abo
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-medium">Parametres</span>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Retour
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Parametres</h1>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">Compte Stripe connecte avec succes!</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {showError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-800 font-medium">Erreur: {showError}</p>
            </div>
          </div>
        )}

        {/* Account section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Compte</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Integration section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635BFF">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Integration Stripe</h2>
              <p className="text-gray-500 text-sm">Synchronise tes abonnes automatiquement</p>
            </div>
          </div>

          {isConnected ? (
            <>
              {/* Connected state */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">
                      Connecte a {userData?.stripe_account_name || userData?.stripe_account_id || 'Stripe'}
                    </p>
                    {userData?.last_sync_at && (
                      <p className="text-sm text-green-600">
                        Derniere synchro: {formatDate(userData.last_sync_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync message */}
              {syncMessage && (
                <div className={`mb-6 p-4 rounded-xl ${
                  syncMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={syncMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {syncMessage.text}
                  </p>
                </div>
              )}

              {/* Sync info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900">Subscribers importes</p>
                    <p className="text-2xl font-bold text-indigo-600">{subscriberCount}</p>
                  </div>
                  {userData?.last_sync_at && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Derniere synchro</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(userData.last_sync_at)}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Synchronisation en cours...
                    </>
                  ) : (
                    'Synchroniser les subscribers'
                  )}
                </button>
              </div>

              {/* Disconnect */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deconnecter Stripe</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Cette action supprimera le lien avec ton compte Stripe. Tes donnees importees seront conservees.
                </p>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Deconnecter
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Autorise Abo a acceder a Stripe</p>
                    <p className="text-sm text-gray-500">Tu seras redirige vers Stripe pour autoriser l&apos;acces</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Import automatique</p>
                    <p className="text-sm text-gray-500">Tes clients et abonnements seront synchronises</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mises a jour en temps reel</p>
                    <p className="text-sm text-gray-500">Les webhooks maintiennent tes donnees a jour</p>
                  </div>
                </div>
              </div>

              <a
                href="/api/stripe/connect"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 text-white bg-[#635BFF] rounded-lg font-medium hover:bg-[#5851ea] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
                Connecter mon compte Stripe
              </a>

              <p className="text-xs text-gray-400 text-center mt-4">
                Abo utilise Stripe Connect pour acceder a tes donnees de maniere securisee.
                Tu peux revoquer l&apos;acces a tout moment.
              </p>
            </>
          )}
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-xl text-xs font-mono">
            <p>Debug: stripe_connected = {String(userData?.stripe_connected)}</p>
            <p>Debug: stripe_account_id = {userData?.stripe_account_id || 'null'}</p>
            <p>Debug: isConnected = {String(isConnected)}</p>
          </div>
        )}
      </main>
    </div>
  );
}
