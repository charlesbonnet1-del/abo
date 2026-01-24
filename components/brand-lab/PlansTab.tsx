'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProductFeature {
  id: string;
  feature_key: string;
  name: string;
}

interface PlanFeature {
  id: string;
  limit_value: number | null;
  limit_description: string | null;
  feature: ProductFeature | null;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_amount: number;
  price_currency: string;
  billing_interval: string | null;
  features_from_stripe: string[];
  features_manual: string[];
  product: { id: string; name: string } | null;
  plan_feature: PlanFeature[];
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  product_feature: ProductFeature[];
}

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plansRes, productsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/products'),
      ]);
      const plansData = await plansRes.json();
      const productsData = await productsRes.json();

      if (plansData.error) {
        setError(plansData.error);
      } else {
        setPlans(plansData.plans || []);
      }

      if (!productsData.error) {
        setProducts(productsData.products || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncFromStripe = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/plans/sync', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(data.message || 'Synchronisation terminée');
        await loadData();
      }
    } catch (err) {
      console.error('Error syncing:', err);
      setError('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const updatePlan = async (planId: string, updates: Partial<Plan>) => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...data.plan } : p)));
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Erreur lors de la mise à jour');
    }
  };

  const linkPlanFeature = async (planId: string, featureId: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: featureId }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Reload to get updated plan features
        await loadData();
      }
    } catch (err) {
      console.error('Error linking feature:', err);
      setError('Erreur lors de l\'ajout');
    }
  };

  const unlinkPlanFeature = async (planId: string, featureId: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}/features?feature_id=${featureId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        await loadData();
      }
    } catch (err) {
      console.error('Error unlinking feature:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Fermer
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Stripe metadata helper */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Configuration automatique des features
              </h4>
              <p className="text-sm text-blue-700">
                Pour configurer automatiquement les features par plan, ajoute dans Stripe &gt;
                Products &gt; [Ton produit] &gt; Metadata :
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-blue-200 font-mono text-xs">
                <span className="text-blue-600">Clé :</span> features
                <br />
                <span className="text-blue-600">Valeur :</span> dashboard,export,api{' '}
                <span className="text-gray-400">(IDs des features séparés par des virgules)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Plans tarifaires</h2>
          <p className="text-sm text-gray-500">
            Synchronise tes plans depuis Stripe et configure les features incluses
          </p>
        </div>
        <Button onClick={syncFromStripe} disabled={syncing}>
          {syncing ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Synchronisation...
            </span>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Synchroniser depuis Stripe
            </>
          )}
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Aucun plan</h3>
            <p className="text-sm text-gray-500 mb-4">
              Clique sur &quot;Synchroniser depuis Stripe&quot; pour importer tes plans
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedPlan === plan.id ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatPrice(plan.price_amount, plan.price_currency)} /{' '}
                          {plan.billing_interval === 'year' ? 'an' : 'mois'}
                        </span>
                        {plan.stripe_product_id && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Stripe
                          </span>
                        )}
                        {!plan.is_active && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            Inactif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(plan.features_manual?.length || 0) +
                      (plan.plan_feature?.length || 0) +
                      (plan.features_from_stripe?.length || 0)}{' '}
                    features
                  </div>
                </div>
              </CardHeader>

              {expandedPlan === plan.id && (
                <CardContent className="border-t">
                  <div className="space-y-4 pt-4">
                    {/* Plan info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Produit associé
                        </label>
                        <select
                          value={plan.product?.id || ''}
                          onChange={(e) =>
                            updatePlan(plan.id, { product_id: e.target.value || null } as unknown as Partial<Plan>)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="">Non associé</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={plan.description || ''}
                          onChange={(e) =>
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.id === plan.id ? { ...p, description: e.target.value } : p
                              )
                            )
                          }
                          onBlur={() => updatePlan(plan.id, { description: plan.description })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Description du plan..."
                        />
                      </div>
                    </div>

                    {/* Features from Stripe metadata */}
                    {plan.features_from_stripe && plan.features_from_stripe.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Features depuis Stripe (metadata)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.features_from_stripe.map((f) => (
                            <span
                              key={f}
                              className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features manuelles (override) */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Features manuelles (override)
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">
                        Si définies, ces features remplaceront celles de Stripe
                      </p>
                      <input
                        type="text"
                        value={plan.features_manual?.join(', ') || ''}
                        onChange={(e) =>
                          setPlans((prev) =>
                            prev.map((p) =>
                              p.id === plan.id
                                ? {
                                    ...p,
                                    features_manual: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  }
                                : p
                            )
                          )
                        }
                        onBlur={() =>
                          updatePlan(plan.id, { features_manual: plan.features_manual })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="feature1, feature2, feature3"
                      />
                    </div>

                    {/* Features détaillées (avec limites) */}
                    {plan.product && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Features détaillées (avec limites)
                        </h4>
                        <div className="space-y-2">
                          {/* Existing linked features */}
                          {plan.plan_feature?.map((pf) => (
                            <div
                              key={pf.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">
                                {pf.feature?.name || 'Feature inconnue'}
                              </span>
                              <div className="flex items-center gap-2">
                                {pf.limit_value !== null && (
                                  <span className="text-xs text-gray-500">
                                    Limite: {pf.limit_value}
                                  </span>
                                )}
                                <button
                                  onClick={() =>
                                    pf.feature && unlinkPlanFeature(plan.id, pf.feature.id)
                                  }
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Retirer
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add feature dropdown */}
                          {products.find((p) => p.id === plan.product?.id)?.product_feature
                            ?.length ? (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  linkPlanFeature(plan.id, e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                              <option value="">+ Ajouter une feature...</option>
                              {products
                                .find((p) => p.id === plan.product?.id)
                                ?.product_feature?.filter(
                                  (f) => !plan.plan_feature?.find((pf) => pf.feature?.id === f.id)
                                )
                                .map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.feature_key})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Associe d&apos;abord ce plan à un produit pour pouvoir lier des
                              features
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
