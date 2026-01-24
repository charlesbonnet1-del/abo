'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProductFeature {
  id: string;
  feature_key: string;
  name: string;
  description_short: string | null;
  description_long: string | null;
  benefit: string | null;
  how_to_access: string | null;
  use_cases: string[];
  keywords: string[];
  is_core: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  aha_moment_description: string | null;
  target_audience: string | null;
  product_feature: ProductFeature[];
}

const productTypes = [
  { value: 'saas', label: 'SaaS' },
  { value: 'mobile_app', label: 'Application mobile' },
  { value: 'api', label: 'API' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Autre' },
];

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nouveau produit' }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) => [{ ...data.product, product_feature: [] }, ...prev]);
        setExpandedProduct(data.product.id);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Erreur lors de la création');
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    setSavingProduct(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, ...data.product } : p))
        );
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Erreur lors de la mise à jour');
    } finally {
      setSavingProduct(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Supprimer ce produit et toutes ses features ?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const addFeature = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_key: `feature_${Date.now()}`,
          name: 'Nouvelle feature',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, product_feature: [...p.product_feature, data.feature] }
              : p
          )
        );
        setEditingFeature(data.feature.id);
      }
    } catch (err) {
      console.error('Error adding feature:', err);
      setError('Erreur lors de l\'ajout');
    }
  };

  const updateFeature = async (
    productId: string,
    featureId: string,
    updates: Partial<ProductFeature>
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}/features/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  product_feature: p.product_feature.map((f) =>
                    f.id === featureId ? data.feature : f
                  ),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error updating feature:', err);
      setError('Erreur lors de la mise à jour');
    }
  };

  const deleteFeature = async (productId: string, featureId: string) => {
    if (!confirm('Supprimer cette feature ?')) return;

    try {
      const res = await fetch(`/api/products/${productId}/features/${featureId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, product_feature: p.product_feature.filter((f) => f.id !== featureId) }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error deleting feature:', err);
      setError('Erreur lors de la suppression');
    }
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mes produits</h2>
          <p className="text-sm text-gray-500">
            Configure tes produits et leurs features pour personnaliser les messages des agents
          </p>
        </div>
        <Button onClick={createProduct}>+ Nouveau produit</Button>
      </div>

      {products.length === 0 ? (
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Aucun produit</h3>
            <p className="text-sm text-gray-500 mb-4">
              Commence par créer ton premier produit
            </p>
            <Button onClick={createProduct}>Créer un produit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedProduct(expandedProduct === product.id ? null : product.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedProduct === product.id ? 'rotate-90' : ''
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
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {product.product_feature?.length || 0} features
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProduct(product.id);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </CardHeader>

              {expandedProduct === product.id && (
                <CardContent className="border-t">
                  <div className="space-y-4 pt-4">
                    {/* Product info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du produit
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) =>
                            setProducts((prev) =>
                              prev.map((p) =>
                                p.id === product.id ? { ...p, name: e.target.value } : p
                              )
                            )
                          }
                          onBlur={() => updateProduct(product.id, { name: product.name })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de produit
                        </label>
                        <select
                          value={product.product_type || ''}
                          onChange={(e) =>
                            updateProduct(product.id, { product_type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="">Sélectionner...</option>
                          {productTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={product.description || ''}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === product.id ? { ...p, description: e.target.value } : p
                            )
                          )
                        }
                        onBlur={() =>
                          updateProduct(product.id, { description: product.description })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                        placeholder="Description du produit..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aha! Moment
                      </label>
                      <textarea
                        value={product.aha_moment_description || ''}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === product.id
                                ? { ...p, aha_moment_description: e.target.value }
                                : p
                            )
                          )
                        }
                        onBlur={() =>
                          updateProduct(product.id, {
                            aha_moment_description: product.aha_moment_description,
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                        placeholder="Le moment où l'utilisateur comprend la valeur..."
                      />
                    </div>

                    {/* Features section */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Features</h4>
                        <button
                          onClick={() => addFeature(product.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          + Ajouter
                        </button>
                      </div>

                      {product.product_feature?.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucune feature. Clique sur &quot;+ Ajouter&quot; pour commencer.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {product.product_feature?.map((feature) => (
                            <div
                              key={feature.id}
                              className="p-3 border border-gray-200 rounded-lg"
                            >
                              {editingFeature === feature.id ? (
                                <FeatureEditForm
                                  feature={feature}
                                  onSave={(updates) => {
                                    updateFeature(product.id, feature.id, updates);
                                    setEditingFeature(null);
                                  }}
                                  onCancel={() => setEditingFeature(null)}
                                />
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {feature.name}
                                      </span>
                                      <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {feature.feature_key}
                                      </code>
                                      {feature.is_core && (
                                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                          Core
                                        </span>
                                      )}
                                    </div>
                                    {feature.description_short && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        {feature.description_short}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingFeature(feature.id)}
                                      className="text-sm text-indigo-600 hover:text-indigo-700"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => deleteFeature(product.id, feature.id)}
                                      className="text-sm text-red-600 hover:text-red-700"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {savingProduct === product.id && (
                      <p className="text-sm text-gray-500">Sauvegarde en cours...</p>
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

function FeatureEditForm({
  feature,
  onSave,
  onCancel,
}: {
  feature: ProductFeature;
  onSave: (updates: Partial<ProductFeature>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    feature_key: feature.feature_key,
    name: feature.name,
    description_short: feature.description_short || '',
    description_long: feature.description_long || '',
    benefit: feature.benefit || '',
    how_to_access: feature.how_to_access || '',
    use_cases: feature.use_cases?.join(', ') || '',
    keywords: feature.keywords?.join(', ') || '',
    is_core: feature.is_core,
  });

  const handleSave = () => {
    onSave({
      ...form,
      use_cases: form.use_cases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      keywords: form.keywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Clé unique</label>
          <input
            type="text"
            value={form.feature_key}
            onChange={(e) => setForm((f) => ({ ...f, feature_key: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="dashboard"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="Tableaux de bord"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description courte</label>
        <input
          type="text"
          value={form.description_short}
          onChange={(e) => setForm((f) => ({ ...f, description_short: e.target.value }))}
          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
          placeholder="Créez des dashboards personnalisés"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description détaillée
        </label>
        <textarea
          value={form.description_long}
          onChange={(e) => setForm((f) => ({ ...f, description_long: e.target.value }))}
          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none"
          rows={2}
          placeholder="Description complète de la feature..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Bénéfice client</label>
          <input
            type="text"
            value={form.benefit}
            onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="Gagnez du temps"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Comment y accéder</label>
          <input
            type="text"
            value={form.how_to_access}
            onChange={(e) => setForm((f) => ({ ...f, how_to_access: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="Menu > Analytics"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cas d&apos;usage (virgules)
          </label>
          <input
            type="text"
            value={form.use_cases}
            onChange={(e) => setForm((f) => ({ ...f, use_cases: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="Suivi ventes, Reporting"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Keywords (virgules)
          </label>
          <input
            type="text"
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            placeholder="dashboard, analytics"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_core"
          checked={form.is_core}
          onChange={(e) => setForm((f) => ({ ...f, is_core: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600"
        />
        <label htmlFor="is_core" className="text-sm text-gray-700">
          Feature &quot;core&quot; (présente depuis toujours)
        </label>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={handleSave}>
          Sauvegarder
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
