'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeAgo } from '@/components/ui/TimeAgo';

interface UserData {
  stripe_connected: boolean;
  stripe_account_name: string | null;
  last_sync_at: string | null;
}

export default function SourcesPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user data
      const { data: userDataResult } = await supabase
        .from('user')
        .select('stripe_connected, stripe_account_name, last_sync_at')
        .eq('id', user.id)
        .single();

      if (userDataResult) {
        setUserData(userDataResult);
      }

      // Load subscriber count
      const { count } = await supabase
        .from('subscriber')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count !== null) {
        setSubscriberCount(count);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/stripe/sync', {
        method: 'POST',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Es-tu sûr de vouloir déconnecter Stripe ? Cette action supprimera toutes les données synchronisées.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user to remove Stripe connection
      await supabase
        .from('user')
        .update({
          stripe_connected: false,
          stripe_account_id: null,
          stripe_account_name: null,
          stripe_access_token: null,
          last_sync_at: null,
        })
        .eq('id', user.id);

      // Delete all subscribers
      await supabase
        .from('subscriber')
        .delete()
        .eq('user_id', user.id);

      await loadData();
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/stripe/connect';
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/demo2"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Sources de données</h1>
        <p className="text-gray-500 mt-1">Connecte tes outils pour alimenter tes agents IA</p>
      </div>

      <div className="space-y-6">
        {/* Stripe */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">Stripe</h3>
                  {userData?.stripe_connected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Connecté
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Non connecté
                    </span>
                  )}
                </div>

                {userData?.stripe_connected ? (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Compte: <span className="font-medium">{userData.stripe_account_name || 'Sans nom'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Dernière synchro: <TimeAgo date={userData.last_sync_at} />
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {subscriberCount} clients synchronisés
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleSync}
                        disabled={syncing}
                      >
                        {syncing ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Synchronisation...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Synchroniser
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4">
                      Connecte ton compte Stripe pour synchroniser tes clients et leurs abonnements
                    </p>
                    <Button onClick={handleConnect}>
                      Connecter Stripe
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PostHog - Coming Soon */}
        <Card className="opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.64 0 8.4 3.76 8.4 8.4s-3.76 8.4-8.4 8.4S3.6 16.64 3.6 12 7.36 3.6 12 3.6z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">PostHog</h3>
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    Bientôt
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Connecte tes données comportementales pour des insights plus profonds
                </p>
                <Button disabled>
                  Connecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segment - Coming Soon */}
        <Card className="opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.308l8.308 4.788v9.576L12 21.46l-8.308-4.788V7.096L12 2.308z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">Segment</h3>
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    Bientôt
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Connecte tes données client depuis Segment CDP
                </p>
                <Button disabled>
                  Connecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intercom - Coming Soon */}
        <Card className="opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 17.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm1.5-4.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V8.25c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">Intercom</h3>
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    Bientôt
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Synchronise tes conversations client pour personnaliser les agents
                </p>
                <Button disabled>
                  Connecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
