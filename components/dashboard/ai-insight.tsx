import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AIInsightProps {
  atRiskCount: number;
  topAtRiskSubscriber?: {
    id: string;
    name: string | null;
    email: string;
    mrr: number;
    healthScore: number | null;
  } | null;
}

export function AIInsight({ atRiskCount, topAtRiskSubscriber }: AIInsightProps) {
  if (atRiskCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="font-semibold text-green-800 mb-1">Tout va bien !</h3>
            <p className="text-green-700 text-sm">
              Aucun abonné à risque détecté. Continue comme ça !
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-800 mb-2">Ce que je remarque</h3>
          {topAtRiskSubscriber ? (
            <>
              <p className="text-indigo-700 text-sm leading-relaxed mb-4">
                <strong>{topAtRiskSubscriber.name || topAtRiskSubscriber.email}</strong>{' '}
                ({formatCurrency(topAtRiskSubscriber.mrr)}/mois) montre des signes de
                désengagement avec un score santé de{' '}
                <strong>{topAtRiskSubscriber.healthScore || 0}/100</strong>.{' '}
                {atRiskCount > 1 &&
                  `Et ${atRiskCount - 1} autre${atRiskCount > 2 ? 's' : ''} abonné${
                    atRiskCount > 2 ? 's' : ''
                  } à surveiller.`}
              </p>
              <Link href={`/subscribers/${topAtRiskSubscriber.id}`}>
                <Button variant="primary" size="sm">
                  Creuser
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-indigo-700 text-sm">
              {atRiskCount} abonné{atRiskCount > 1 ? 's' : ''} à risque détecté
              {atRiskCount > 1 ? 's' : ''}. Vérifie la liste des abonnés.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
