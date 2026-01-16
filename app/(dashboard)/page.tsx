'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStats, mrrHistory, formatCurrency, warningGroups, getTotalMrrAtRisk } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/badge';
import { CoachChips } from '@/components/coach';
import { PeriodSelector, WarningsGrid, Period } from '@/components/dashboard';

// KPI card with coach chips
interface KpiCardProps {
  label: string;
  value: string | number;
  change: number;
  coachQuestions: Array<{ text: string; mockAnswer: string }>;
}

function KpiCard({ label, value, change, coachQuestions }: KpiCardProps) {
  const isPositive = change >= 0;
  const isNegativeGood = label.toLowerCase().includes('churn');
  const displayPositive = isNegativeGood ? !isPositive : isPositive;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span
          className={`text-sm font-medium ${
            displayPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isPositive ? '+' : ''}{change}%
          {displayPositive ? ' ▲' : ' ▼'}
        </span>
      </div>
      <div className="mt-3">
        <CoachChips questions={coachQuestions} className="gap-1" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const stats = getStats();
  const totalMrrAtRisk = getTotalMrrAtRisk();

  // Coach questions for each KPI
  const mrrQuestions = [
    {
      text: 'Pourquoi +12% ?',
      mockAnswer: `Votre MRR a augmente de 12% ce mois grace a :\n\n**Contributions positives :**\n- 3 nouveaux clients payants (+350€)\n- 2 upgrades Starter → Growth (+116€)\n- 1 reactivation churn (+49€)\n\n**Pertes :**\n- 1 churn (Julien Blanc, -149€)\n- 2 paiements echoues en attente\n\n**Net :** +366€ MRR ce mois`,
    },
    {
      text: 'Prevision M+1 ?',
      mockAnswer: `**Projection MRR pour le mois prochain :**\n\n📈 **Scenario optimiste :** 1 450€ (+17%)\n- Si les 3 trials convertissent\n- Si les paiements echoues sont recuperes\n\n📊 **Scenario realiste :** 1 320€ (+6%)\n- Conversion 2/3 trials\n- Recuperation 1 paiement\n\n📉 **Scenario pessimiste :** 1 180€ (-5%)\n- Aucune conversion trial\n- Perte des 2 paiements echoues`,
    },
  ];

  const usersQuestions = [
    {
      text: 'Qui sont-ils ?',
      mockAnswer: `**Repartition des ${stats.activeUsersCount} users actifs :**\n\n**Par plan :**\n- Starter : 4 users (49€/mois)\n- Growth : 2 users (99€/mois)\n- Team : 1 user (149€/mois)\n\n**Par anciennete :**\n- < 3 mois : 3 users\n- 3-12 mois : 3 users\n- > 12 mois : 1 user\n\n**Top users par MRR :**\n1. Startup Co (149€)\n2. Tech Sarl (99€)\n3. Agence Martin (99€)`,
    },
    {
      text: 'Tendance ?',
      mockAnswer: `**Tendance users actifs :**\n\n📈 **+8% ce mois** (vs -2% le mois dernier)\n\n**Evolution sur 6 mois :**\n- Jan : 5 users\n- Fev : 5 users\n- Mar : 6 users\n- Avr : 6 users\n- Mai : 7 users ← aujourd'hui\n\n**Projection :** 8-9 users fin du trimestre si tendance maintenue`,
    },
  ];

  const churnQuestions = [
    {
      text: 'Pourquoi ?',
      mockAnswer: `**Analyse du churn (${stats.churnRate}%) :**\n\n**Causes principales :**\n1. **Paiements echoues** (40%) — 2 users\n2. **Inactivite** (35%) — Pas de connexion 30j+\n3. **Prix** (15%) — Feedbacks "trop cher"\n4. **Fonctionnalites** (10%) — Manque feature cle\n\n**Cohorte la plus touchee :**\nUsers acquis avec promo LAUNCH50 (churn 18% vs 5% moyenne)`,
    },
    {
      text: 'Qui est a risque ?',
      mockAnswer: `**Users a risque de churn :**\n\n🔴 **Critique (churn imminent) :**\n1. marie@startup.fr — 3 paiements echoues\n2. julien.blanc@corp.io — Inactif 30 jours\n\n🟡 **A surveiller :**\n3. pierre.leroy@free.fr — Health score 45\n4. paul.moreau@acme.io — Trial expire J+2\n\n**MRR a risque total :** ${totalMrrAtRisk}€`,
    },
  ];

  const conversionQuestions = [
    {
      text: 'Comment ameliorer ?',
      mockAnswer: `**Ameliorer la conversion trial→paid (${stats.trialConversionRate}%) :**\n\n**Quick wins :**\n1. Email J+3 avec cas d'usage → +15% conversion\n2. Onboarding guide in-app → +20% engagement\n3. Call decouverte pour trials > 50€ → +35% conversion\n\n**Votre conversion vs marche :**\n- Votre taux : ${stats.trialConversionRate}%\n- Moyenne SaaS B2B : 15-25%\n- Top performers : 30-40%`,
    },
    {
      text: 'Quels trials ?',
      mockAnswer: `**Trials en cours (${stats.trialCount}) :**\n\n**Proches de convertir :**\n1. paul.moreau@acme.io\n   - Expire dans 2 jours\n   - Health score : 85 (excellent)\n   - Utilise 4/5 features cles\n\n**A relancer :**\n2. lea.martinez@company.com\n   - Expire dans 5 jours\n   - Health score : 60 (moyen)\n   - N'a pas configure les integrations\n\n**A risque :**\n3. startup@test.io\n   - Expire dans 3 jours\n   - Health score : 35 (faible)\n   - Derniere connexion il y a 8 jours`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de ton activite</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards with Coach Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="MRR"
          value={formatCurrency(stats.mrr)}
          change={stats.mrrGrowth}
          coachQuestions={mrrQuestions}
        />
        <KpiCard
          label="Users actifs"
          value={stats.activeUsersCount}
          change={stats.activeUsersGrowth}
          coachQuestions={usersQuestions}
        />
        <KpiCard
          label="Churn rate"
          value={`${stats.churnRate}%`}
          change={0.5}
          coachQuestions={churnQuestions}
        />
        <KpiCard
          label="Trial → Paid"
          value={`${stats.trialConversionRate}%`}
          change={-2}
          coachQuestions={conversionQuestions}
        />
      </div>

      {/* Warnings Grid */}
      <div className="mb-8">
        <WarningsGrid warnings={warningGroups} />
      </div>

      {/* MRR Chart */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Evolution MRR</h2>
          <CoachChips
            questions={[
              {
                text: 'Comment accelerer ?',
                mockAnswer: `**Strategies pour accelerer la croissance MRR :**\n\n**Court terme (ce mois) :**\n1. Convertir les 3 trials actifs → +180€ potentiel\n2. Recuperer les paiements echoues → +198€\n3. Upgrade Pierre (limite atteinte) → +50€\n\n**Moyen terme (3 mois) :**\n1. Augmenter les prix de 10-15%\n2. Ajouter un plan "Scale" premium\n3. Programme de parrainage (LTV 40% superieur)\n\n**Potentiel a 3 mois :** +40-60% MRR`,
              },
            ]}
          />
        </div>
        <div className="h-48 flex items-end gap-2">
          {mrrHistory.map((data, i) => {
            const maxMrr = Math.max(...mrrHistory.map((d) => d.mrr));
            const heightPercent = (data.mrr / maxMrr) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600"
                  style={{ height: `${heightPercent}%` }}
                  title={`${formatCurrency(data.mrr)}`}
                />
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-gray-500">6 derniers mois</span>
          <span className="text-green-600 font-medium">+{stats.mrrGrowth}% ce mois</span>
        </div>
      </Card>

      {/* Quick Stats by Status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <Link href="/users?status=freemium" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="freemium" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.freemiumCount}</p>
          <p className="text-xs text-gray-500">Freemium</p>
        </Link>
        <Link href="/users?status=trial" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="trial" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.trialCount}</p>
          <p className="text-xs text-gray-500">Trial</p>
        </Link>
        <Link href="/users?status=active" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="active" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeUsersCount}</p>
          <p className="text-xs text-gray-500">Actifs</p>
        </Link>
        <Link href="/users?status=at_risk" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="at_risk" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.atRiskCount}</p>
          <p className="text-xs text-gray-500">A risque</p>
        </Link>
        <Link href="/users?status=churned" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="churned" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.churnedCount}</p>
          <p className="text-xs text-gray-500">Churnes</p>
        </Link>
      </div>

      {/* View All Users */}
      <Link
        href="/users"
        className="block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Voir tous les users →
      </Link>
    </div>
  );
}
