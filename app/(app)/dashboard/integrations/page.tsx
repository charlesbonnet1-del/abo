'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeAgo } from '@/components/ui/TimeAgo';

interface UserData {
  stripe_connected: boolean;
  stripe_account_name: string | null;
  last_sync_at: string | null;
}

export default function IntegrationsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browser' | 'nodejs'>('browser');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: userDataResult } = await supabase
        .from('user')
        .select('stripe_connected, stripe_account_name, last_sync_at')
        .eq('id', user.id)
        .single();

      if (userDataResult) setUserData(userDataResult);

      const { count } = await supabase
        .from('subscriber')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count !== null) setSubscriberCount(count);

      // Load API key
      const keyRes = await fetch('/api/sdk/api-key');
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setApiKey(keyData.apiKey);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/stripe/sync', { method: 'POST' });
      if (response.ok) await loadData();
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Es-tu sûr de vouloir déconnecter Stripe ? Cette action supprimera toutes les données synchronisées.')) return;
    setDisconnecting(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user').update({
        stripe_connected: false,
        stripe_account_id: null,
        stripe_account_name: null,
        stripe_access_token: null,
        last_sync_at: null,
      }).eq('id', user.id);

      await supabase.from('subscriber').delete().eq('user_id', user.id);
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

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/sdk/api-key', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Error generating key:', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const browserSnippet = `<!-- Abo Analytics SDK -->
<script src="${appUrl}/abo-analytics.js"></script>
<script>
  AboAnalytics.init({
    apiKey: '${apiKey || 'VOTRE_CLE_API'}',
    endpoint: '${appUrl}/api/sdk/events'
  });

  // Identifier l'utilisateur (quand disponible)
  // AboAnalytics.identify({
  //   email: 'user@example.com',
  //   stripeCustomerId: 'cus_xxx', // optionnel
  //   userId: 'votre-id'           // optionnel
  // });
</script>`;

  const nodejsSnippet = `// npm install node-fetch (si Node < 18)

const ABO_API_KEY = '${apiKey || 'VOTRE_CLE_API'}';
const ABO_ENDPOINT = '${appUrl}/api/sdk/events';

async function trackEvent(event) {
  await fetch(ABO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-abo-key': ABO_API_KEY,
    },
    body: JSON.stringify({
      events: [{
        type: event.type,          // 'custom', 'feature_use', 'page_view'
        name: event.name,          // nom de l'événement
        data: event.data || {},    // données additionnelles
        email: event.email,        // identification par email
        stripeCustomerId: event.stripeCustomerId, // ou par Stripe ID
        userId: event.userId,      // ou par user ID custom
        timestamp: new Date().toISOString(),
      }]
    }),
  });
}

// Exemples d'utilisation :

// Tracker l'utilisation d'une feature
await trackEvent({
  type: 'feature_use',
  name: 'export_pdf',
  email: 'user@example.com',
  data: { format: 'pdf', pages: 12 }
});

// Événement custom
await trackEvent({
  type: 'custom',
  name: 'onboarding_completed',
  stripeCustomerId: 'cus_xxx',
  data: { steps_completed: 5, duration_minutes: 15 }
});`;

  const featureTrackingSnippet = `// Tracker l'utilisation des features (côté navigateur)
// Les noms doivent correspondre aux features du Brand Lab

AboAnalytics.feature('export_pdf');
AboAnalytics.feature('team_collaboration', { members: 3 });
AboAnalytics.feature('api_access', { endpoint: '/users' });

// Événements custom
AboAnalytics.track('upgrade_clicked', { from: 'free', to: 'pro' });
AboAnalytics.track('tutorial_completed', { step: 5 });

// Tracking d'éléments HTML (attribut data-abo-track)
// <button data-abo-track="cta_upgrade">Passer en Pro</button>
// <a data-abo-track="nav_pricing" href="/pricing">Tarifs</a>`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Intégrations</h1>
        <p className="text-gray-500 mt-1">Connecte tes outils et installe le SDK pour alimenter tes agents IA</p>
      </div>

      <div className="space-y-8">

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: STRIPE                          */}
        {/* ═══════════════════════════════════════════ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            </div>
            Stripe
          </h2>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Données transactionnelles</h3>
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
                        <Button variant="secondary" onClick={handleSync} disabled={syncing}>
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
                        Connecte ton compte Stripe pour synchroniser tes clients, abonnements et paiements.
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
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2: ABO SDK                         */}
        {/* ═══════════════════════════════════════════ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            Abo SDK
          </h2>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Pourquoi installer le SDK ?</p>
                <p>Le SDK collecte les données comportementales de tes utilisateurs (pages visitées, features utilisées, clics, sessions...). Ces données permettent à tes agents IA de personnaliser leurs actions et d{"'"}améliorer la rétention, la conversion et l{"'"}onboarding.</p>
              </div>
            </div>
          </div>

          {/* API Key */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-2">Clé API</h3>
              <p className="text-sm text-gray-500 mb-4">
                Ta clé API authentifie le SDK auprès de ton compte Abo. Ne la partage jamais publiquement.
              </p>

              {apiKey ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-700 truncate">
                    {apiKey}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => copyToClipboard(apiKey, 'api-key')}
                    className="flex-shrink-0"
                  >
                    {copiedSnippet === 'api-key' ? (
                      <span className="flex items-center gap-1.5 text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copié
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copier
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleGenerateKey}
                    disabled={generatingKey}
                    className="flex-shrink-0 text-gray-500"
                  >
                    {generatingKey ? 'Génération...' : 'Régénérer'}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerateKey} disabled={generatingKey}>
                  {generatingKey ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Génération...
                    </span>
                  ) : 'Générer une clé API'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SDK Installation */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Installation du SDK</h3>

              {/* Tab selector */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setActiveTab('browser')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'browser'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Navigateur (JS)
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('nodejs')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'nodejs'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                    </svg>
                    Backend (Node.js)
                  </span>
                </button>
              </div>

              {activeTab === 'browser' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Colle ce snippet dans le <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">&lt;head&gt;</code> ou avant la fermeture du <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code> de ton site :
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                      <code>{browserSnippet}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(browserSnippet, 'browser')}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                    >
                      {copiedSnippet === 'browser' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Le SDK collecte automatiquement :</h4>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Pages visitées (+ navigation SPA)
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Clics sur liens et boutons
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Profondeur de scroll
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Sessions (début, fin, durée)
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Appareil, navigateur, OS
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Utilise ce code dans ton backend Node.js pour envoyer des événements serveur :
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                      <code>{nodejsSnippet}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(nodejsSnippet, 'nodejs')}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                    >
                      {copiedSnippet === 'nodejs' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature tracking & Custom events */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-2">Tracking avancé : Features & Événements custom</h3>
              <p className="text-sm text-gray-600 mb-3">
                En plus du tracking automatique, tu peux envoyer des événements manuels pour suivre l{"'"}utilisation des features configurées dans le Brand Lab :
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                  <code>{featureTrackingSnippet}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(featureTrackingSnippet, 'features')}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                >
                  {copiedSnippet === 'features' ? 'Copié !' : 'Copier'}
                </button>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Noms des features</p>
                    <p>Utilise les mêmes noms de features que ceux configurés dans ton Brand Lab (feature_key). Les agents utiliseront ces données pour personnaliser leurs communications.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identification guide */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-2">Identification des utilisateurs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Le SDK supporte 3 méthodes d{"'"}identification. Utilise celle qui correspond à tes données :
              </p>

              <div className="grid gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">email</span>
                    <span className="text-sm font-medium text-gray-800">Par email</span>
                    <span className="text-xs text-gray-500">(recommandé)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    L{"'"}email est automatiquement relié au subscriber Stripe. Idéal si tu connais l{"'"}email de l{"'"}utilisateur connecté.
                  </p>
                  <code className="block mt-2 text-xs bg-gray-100 px-3 py-1.5 rounded text-gray-700">
                    {`AboAnalytics.identify({ email: 'user@example.com' })`}
                  </code>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">stripeCustomerId</span>
                    <span className="text-sm font-medium text-gray-800">Par Stripe Customer ID</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Utilise l{"'"}ID client Stripe si disponible côté serveur. Correspondance directe avec les subscribers.
                  </p>
                  <code className="block mt-2 text-xs bg-gray-100 px-3 py-1.5 rounded text-gray-700">
                    {`AboAnalytics.identify({ stripeCustomerId: 'cus_xxx' })`}
                  </code>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">userId</span>
                    <span className="text-sm font-medium text-gray-800">Par User ID custom</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Ton propre identifiant utilisateur. Utile pour le tracking backend quand tu n{"'"}as ni email ni Stripe ID.
                  </p>
                  <code className="block mt-2 text-xs bg-gray-100 px-3 py-1.5 rounded text-gray-700">
                    {`AboAnalytics.identify({ userId: 'user_123' })`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
