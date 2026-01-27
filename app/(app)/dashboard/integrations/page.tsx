'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeAgo } from '@/components/ui/TimeAgo';
import IntegrationChatbot from '@/components/ui/IntegrationChatbot';

interface UserData {
  stripe_connected: boolean;
  stripe_account_name: string | null;
  last_sync_at: string | null;
}

interface ProductFeature {
  id: string;
  feature_key: string;
  name: string;
  is_core: boolean;
}

interface Product {
  id: string;
  name: string;
  product_feature: ProductFeature[];
}

export default function IntegrationsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // SDK state
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState('');
  const [showBackend, setShowBackend] = useState(false);

  // Feature tracking builder
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  // Identification
  const [identifyMethod, setIdentifyMethod] = useState<'email' | 'stripe' | 'userId' | null>(null);

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

      // Auto-load/generate API key
      const keyRes = await fetch('/api/sdk/api-key');
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setApiKey(keyData.apiKey);
      }

      // Load Brand Lab features
      const featRes = await fetch('/api/products');
      if (featRes.ok) {
        const featData = await featRes.json();
        setProducts(featData.products || []);
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

  const handleRegenerateKey = async () => {
    if (!confirm('Régénérer la clé invalidera l\'ancienne. Le code sur ton site devra être mis à jour. Continuer ?')) return;
    try {
      const res = await fetch('/api/sdk/api-key', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Error regenerating key:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const toggleFeature = (featureKey: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureKey)) {
        next.delete(featureKey);
      } else {
        next.add(featureKey);
      }
      return next;
    });
  };

  // All features across all products
  const allFeatures = products.flatMap(p => p.product_feature || []);

  // ── Generated snippets ──

  const browserSnippet = `<!-- Abo SDK - Colle ce code avant </body> -->
<script src="${appUrl}/abo-analytics.js"></script>
<script>
  AboAnalytics.init({
    apiKey: '${apiKey || '...'}',
    endpoint: '${appUrl}/api/sdk/events'
  });
</script>`;

  const identifySnippet = identifyMethod === 'email'
    ? `// Après la connexion de l'utilisateur, ajoute :
AboAnalytics.identify({ email: utilisateur.email });`
    : identifyMethod === 'stripe'
    ? `// Après la connexion, si tu as le Stripe ID :
AboAnalytics.identify({ stripeCustomerId: utilisateur.stripeId });`
    : identifyMethod === 'userId'
    ? `// Après la connexion de l'utilisateur, ajoute :
AboAnalytics.identify({ userId: utilisateur.id });`
    : '';

  const featureSnippetLines = Array.from(selectedFeatures).map(key => {
    const feat = allFeatures.find(f => f.feature_key === key);
    return `AboAnalytics.feature('${key}');  // ${feat?.name || key}`;
  });

  const featureSnippet = featureSnippetLines.length > 0
    ? `// Appelle ces lignes quand l'utilisateur utilise la feature :\n${featureSnippetLines.join('\n')}`
    : '';

  const backendSnippet = `// Code serveur (Node.js) - Envoie des événements depuis ton backend
const ABO_KEY = '${apiKey || '...'}';

await fetch('${appUrl}/api/sdk/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-abo-key': ABO_KEY,
  },
  body: JSON.stringify({
    events: [{
      type: 'feature_use',         // ou 'custom'
      name: 'nom_de_la_feature',
      email: 'user@example.com',   // pour identifier le client
      data: { /* données libres */ },
    }]
  }),
});`;

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

      <div className="space-y-10">

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
                      <Button onClick={() => { window.location.href = '/api/stripe/connect'; }}>
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
        {/* SECTION 2: ABO SDK - Guided steps          */}
        {/* ═══════════════════════════════════════════ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            Abo SDK
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Le SDK observe le comportement de tes utilisateurs sur ton site (pages visitées, features utilisées, clics...) pour que tes agents IA personnalisent leurs actions.
          </p>

          {/* ── STEP 1: Install the snippet ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">1</span>
              <h3 className="font-semibold text-gray-900">Colle ce code dans ton site</h3>
            </div>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Colle ce code <strong>une seule fois</strong> dans le fichier principal de ton site. Il sera automatiquement chargé sur toutes les pages :
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs text-gray-600 space-y-1">
                  <p><strong>Next.js / React :</strong> dans ton fichier <code className="bg-gray-100 px-1 rounded">layout.tsx</code> (racine)</p>
                  <p><strong>WordPress :</strong> via un plugin Header/Footer (ex: WPCode) ou dans <code className="bg-gray-100 px-1 rounded">footer.php</code></p>
                  <p><strong>HTML classique :</strong> dans ton template commun ou fichier <code className="bg-gray-100 px-1 rounded">footer.html</code></p>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[13px] overflow-x-auto leading-relaxed">
                    <code>{browserSnippet}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(browserSnippet, 'browser')}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                  >
                    {copiedSnippet === 'browser' ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">Une fois installé, le SDK collecte automatiquement :</p>
                  <div className="grid grid-cols-2 gap-1.5 text-sm text-green-700">
                    {['Pages visitées', 'Clics sur boutons', 'Scroll', 'Durée des sessions', 'Appareil & navigateur'].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Key info */}
                {apiKey && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Ta clé API (déjà incluse dans le code ci-dessus) :</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 max-w-[200px] truncate">{apiKey}</code>
                        <button
                          onClick={() => copyToClipboard(apiKey, 'api-key')}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {copiedSnippet === 'api-key' ? 'Copié' : 'Copier'}
                        </button>
                        <button
                          onClick={handleRegenerateKey}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Régénérer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── STEP 2: Identify users ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">2</span>
              <h3 className="font-semibold text-gray-900">Identifie tes utilisateurs</h3>
            </div>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-4">
                  Pour que les agents sachent <strong>quel client</strong> fait quelle action, il faut identifier l{"'"}utilisateur quand il se connecte sur ton site. Choisis la méthode qui correspond à tes données :
                </p>

                <div className="space-y-2 mb-4">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      identifyMethod === 'email' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIdentifyMethod('email')}
                  >
                    <input type="radio" name="identify" checked={identifyMethod === 'email'} onChange={() => setIdentifyMethod('email')} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Par email</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">recommandé</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tu connais l{"'"}email de tes utilisateurs connectés. C{"'"}est le même email que dans Stripe, donc le lien se fait automatiquement.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      identifyMethod === 'stripe' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIdentifyMethod('stripe')}
                  >
                    <input type="radio" name="identify" checked={identifyMethod === 'stripe'} onChange={() => setIdentifyMethod('stripe')} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Par Stripe Customer ID</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tu as accès au Stripe Customer ID (cus_xxx) de tes utilisateurs dans ton code.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      identifyMethod === 'userId' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIdentifyMethod('userId')}
                  >
                    <input type="radio" name="identify" checked={identifyMethod === 'userId'} onChange={() => setIdentifyMethod('userId')} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Par ton propre User ID</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tu as un identifiant unique pour chaque utilisateur dans ta base de données.
                      </p>
                    </div>
                  </label>
                </div>

                {identifyMethod && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Ajoute cette ligne dans ton site, <strong>juste après que l{"'"}utilisateur se connecte</strong> :
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[13px] overflow-x-auto leading-relaxed">
                        <code>{identifySnippet}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(identifySnippet, 'identify')}
                        className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                      >
                        {copiedSnippet === 'identify' ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── STEP 3: Track features ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">3</span>
              <div>
                <h3 className="font-semibold text-gray-900">Suivi des features</h3>
                <span className="text-xs text-gray-500">optionnel mais recommandé</span>
              </div>
            </div>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-1">
                  Indique quand un utilisateur <strong>utilise une feature</strong> de ton produit. Tes agents sauront exactement ce que chaque client utilise (ou pas) pour personnaliser leurs messages.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Sélectionne les features que tu veux suivre, puis copie le code généré.
                </p>

                {allFeatures.length > 0 ? (
                  <>
                    {/* Feature toggles */}
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4">
                      {products.map(product => (
                        <div key={product.id}>
                          {products.length > 1 && (
                            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {product.name}
                            </div>
                          )}
                          {(product.product_feature || []).map(feature => (
                            <label
                              key={feature.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFeatures.has(feature.feature_key)}
                                onChange={() => toggleFeature(feature.feature_key)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                                <span className="ml-2 text-xs text-gray-400 font-mono">{feature.feature_key}</span>
                              </div>
                              {feature.is_core && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">core</span>
                              )}
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Generated code */}
                    {selectedFeatures.size > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Ajoute ces lignes dans ton code, <strong>au moment où l{"'"}utilisateur utilise chaque feature</strong> :
                        </p>
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[13px] overflow-x-auto leading-relaxed">
                            <code>{featureSnippet}</code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard(featureSnippet, 'features')}
                            className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                          >
                            {copiedSnippet === 'features' ? 'Copié !' : 'Copier'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Par exemple, si la feature est &ldquo;export_pdf&rdquo;, place <code className="bg-gray-100 px-1 rounded">AboAnalytics.feature(&apos;export_pdf&apos;)</code> dans le code qui s{"'"}exécute quand l{"'"}utilisateur clique sur le bouton d{"'"}export PDF.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Sélectionne au moins une feature ci-dessus pour générer le code.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Aucune feature configurée</p>
                        <p>
                          Commence par configurer tes produits et features dans le{' '}
                          <a href="/dashboard/brand-lab" className="underline font-medium hover:text-amber-900">Brand Lab</a>.
                          Le SDK utilisera ces features pour le tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* HTML attribute tracking */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Alternative sans code : tracking par attribut HTML
                    </summary>
                    <div className="mt-3 ml-6 text-sm text-gray-600">
                      <p className="mb-2">
                        Tu peux aussi tracker les clics sur des boutons <strong>sans écrire de JavaScript</strong>. Ajoute simplement l{"'"}attribut <code className="bg-gray-100 px-1 rounded text-xs font-mono">data-abo-track</code> sur n{"'"}importe quel bouton ou lien :
                      </p>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-[13px] overflow-x-auto">
                          <code>{`<!-- Le SDK détecte automatiquement les clics sur ces éléments -->
<button data-abo-track="export_pdf">Exporter en PDF</button>
<a data-abo-track="upgrade_pro" href="/pricing">Passer en Pro</a>`}</code>
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── OPTIONAL: Backend SDK ── */}
          <div className="mb-6">
            <button
              onClick={() => setShowBackend(!showBackend)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showBackend ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium">Optionnel : envoyer des événements depuis ton backend (Node.js)</span>
            </button>

            {showBackend && (
              <Card className="mt-3">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600 mb-3">
                    Si tu veux envoyer des événements depuis ton serveur (par exemple quand un utilisateur effectue une action côté backend), utilise ce code :
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[13px] overflow-x-auto leading-relaxed">
                      <code>{backendSnippet}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(backendSnippet, 'backend')}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-md transition-colors"
                    >
                      {copiedSnippet === 'backend' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>

      {/* Chatbot d'aide à l'intégration */}
      <IntegrationChatbot />
    </div>
  );
}
