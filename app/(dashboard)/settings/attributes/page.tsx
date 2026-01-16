'use client';

import { AttributeList } from '@/components/attributes';
import { CoachChips } from '@/components/coach';

export default function AttributesSettingsPage() {
  const coachQuestions = [
    {
      text: 'Quels attributs sont utiles?',
      mockAnswer: `**Attributs recommandes pour votre business :**\n\n📊 **Essentiels pour la segmentation :**\n- Secteur d'activite → segmenter par industrie\n- Taille entreprise → adapter le pricing\n- Source acquisition → mesurer le ROI marketing\n\n💡 **Pour le scoring :**\n- Potentiel upsell → prioriser les opportunites\n- Score NPS → identifier les ambassadeurs\n\n📈 **Pour l'analyse :**\n- Date premier contact → mesurer le cycle de vente\n- Account manager → suivre la performance`,
    },
    {
      text: 'Comment bien segmenter?',
      mockAnswer: `**Bonnes pratiques de segmentation :**\n\n✅ **Combiner plusieurs attributs :**\n- Plan + Activite → identifier les at-risk\n- Secteur + Taille → personnaliser l'onboarding\n- Source + Conversion → optimiser l'acquisition\n\n⚠️ **Eviter :**\n- Trop de segments (max 10-15)\n- Attributs non renseignes (>50% vide)\n- Segments qui se chevauchent\n\n💡 **Astuce :** Commencez par 3-4 segments cles, puis affinez.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attributs users</h1>
        <p className="text-gray-600 mt-2">
          Les attributs permettent d&apos;enrichir les fiches users avec des informations
          personnalisees. Ils peuvent etre utilises dans les segments et automations.
        </p>
      </div>

      {/* Attribute List */}
      <AttributeList />

      {/* Coach Chips */}
      <div className="mt-8">
        <CoachChips questions={coachQuestions} />
      </div>
    </div>
  );
}
