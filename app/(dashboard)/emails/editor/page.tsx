'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  EmailBlock,
  EmailRecipient,
  BlocksPalette,
  EmailCanvas,
  BlockEditor,
  RecipientSelector,
  blockTemplates,
} from '@/components/email-builder';

// Default email template
const defaultBlocks: EmailBlock[] = [
  {
    id: '1',
    type: 'header',
    content: 'Bienvenue {name} !',
    level: 'h1',
    align: 'center',
    color: '#1f2937',
  },
  {
    id: '2',
    type: 'text',
    content: 'Nous sommes ravis de vous compter parmi nous chez {company}.\n\nVotre compte est maintenant actif et pret a etre utilise.',
    align: 'left',
    fontSize: 'medium',
    color: '#374151',
  },
  {
    id: '3',
    type: 'button',
    text: 'Commencer maintenant',
    url: 'https://app.abo.io',
    backgroundColor: '#4f46e5',
    textColor: '#ffffff',
    borderRadius: 'medium',
    align: 'center',
    fullWidth: false,
  },
  {
    id: '4',
    type: 'spacer',
    height: 24,
  },
  {
    id: '5',
    type: 'footer',
    companyName: 'Abo',
    address: '123 rue de la Startup, 75001 Paris',
    unsubscribeText: 'Se desabonner',
    showUnsubscribe: true,
  },
];

export default function EmailEditorPage() {
  const [blocks, setBlocks] = useState<EmailBlock[]>(defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState('Bienvenue sur Abo, {name}!');
  const [previewMode, setPreviewMode] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const previewVariables = {
    name: 'Jean Dupont',
    company: 'Acme Corp',
    plan: 'Growth',
    email: 'jean@acme.com',
    days: '3',
  };

  const handleAddBlock = (block: EmailBlock) => {
    setBlocks([...blocks, block]);
    setSelectedBlockId(block.id);
  };

  const handleUpdateBlock = (updatedBlock: EmailBlock) => {
    setBlocks(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const handleSend = () => {
    const totalRecipients = recipients.reduce((sum, r) => sum + r.count, 0);
    alert(`Email envoye a ${totalRecipients} destinataires (simulation)`);
    console.log({ recipients, subject, blocks });
  };

  const handleSendTest = () => {
    alert('Email de test envoye a demo@abo.app (simulation)');
  };

  const handleSaveTemplate = () => {
    alert('Template sauvegarde (simulation)');
    console.log({ subject, blocks });
  };

  const handleLoadTemplate = (templateType: string) => {
    switch (templateType) {
      case 'welcome':
        setBlocks([
          {
            id: crypto.randomUUID(),
            type: 'header' as const,
            content: 'Bienvenue {name} !',
            level: 'h1' as const,
            align: 'center' as const,
            color: '#1f2937',
          },
          {
            id: crypto.randomUUID(),
            type: 'text' as const,
            content: 'Nous sommes ravis de vous compter parmi nous.\n\nVotre compte est maintenant actif.',
            align: 'left' as const,
            fontSize: 'medium' as const,
            color: '#374151',
          },
          {
            id: crypto.randomUUID(),
            type: 'button' as const,
            text: 'Commencer',
            url: 'https://app.abo.io',
            backgroundColor: '#4f46e5',
            textColor: '#ffffff',
            borderRadius: 'medium' as const,
            align: 'center' as const,
            fullWidth: false,
          },
          blockTemplates.footer(),
        ]);
        setSubject('Bienvenue sur Abo, {name}!');
        break;

      case 'trial_ending':
        setBlocks([
          {
            id: crypto.randomUUID(),
            type: 'header' as const,
            content: 'Votre trial expire bientot',
            level: 'h2' as const,
            align: 'center' as const,
            color: '#1f2937',
          },
          {
            id: crypto.randomUUID(),
            type: 'text' as const,
            content: 'Bonjour {name},\n\nVotre periode d\'essai expire dans quelques jours.\n\nNe perdez pas acces a toutes vos donnees et fonctionnalites.',
            align: 'left' as const,
            fontSize: 'medium' as const,
            color: '#374151',
          },
          {
            id: crypto.randomUUID(),
            type: 'button' as const,
            text: 'Passer au plan payant',
            url: 'https://example.com',
            backgroundColor: '#059669',
            textColor: '#ffffff',
            borderRadius: 'medium' as const,
            align: 'center' as const,
            fullWidth: false,
          },
          blockTemplates.spacer(),
          blockTemplates.footer(),
        ]);
        setSubject('Votre trial expire dans {days} jours');
        break;

      case 'reengagement':
        setBlocks([
          {
            id: crypto.randomUUID(),
            type: 'header' as const,
            content: '{name}, vous nous manquez !',
            level: 'h1' as const,
            align: 'center' as const,
            color: '#1f2937',
          },
          {
            id: crypto.randomUUID(),
            type: 'text' as const,
            content: 'Cela fait un moment que nous ne vous avons pas vu.\n\nNous avons ajoute de nouvelles fonctionnalites qui pourraient vous interesser.',
            align: 'left' as const,
            fontSize: 'medium' as const,
            color: '#374151',
          },
          {
            id: crypto.randomUUID(),
            type: 'button' as const,
            text: 'Decouvrir les nouveautes',
            url: 'https://example.com',
            backgroundColor: '#7c3aed',
            textColor: '#ffffff',
            borderRadius: 'medium' as const,
            align: 'center' as const,
            fullWidth: false,
          },
          blockTemplates.divider(),
          {
            id: crypto.randomUUID(),
            type: 'text' as const,
            content: 'A bientot,\nL\'equipe Abo',
            align: 'left' as const,
            fontSize: 'small' as const,
            color: '#374151',
          },
          blockTemplates.footer(),
        ]);
        setSubject('{name}, vous nous manquez !');
        break;

      default:
        setBlocks(defaultBlocks);
    }

    setSelectedBlockId(null);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/emails"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Builder</h1>
              <p className="text-sm text-gray-500">Glissez-deposez pour creer votre email</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Template selector */}
            <select
              onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              defaultValue=""
            >
              <option value="" disabled>Charger un template...</option>
              <option value="welcome">Bienvenue</option>
              <option value="trial_ending">Trial expire</option>
              <option value="reengagement">Reengagement</option>
            </select>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                previewMode
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {previewMode ? 'Mode edition' : 'Apercu'}
            </button>

            <button
              onClick={handleSaveTemplate}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Sauvegarder
            </button>
            <button
              onClick={handleSendTest}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Envoyer test
            </button>
            <button
              onClick={handleSend}
              disabled={recipients.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Subject & Recipients row */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sujet de l&apos;email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Apercu: {subject.replace(/{name}/g, previewVariables.name).replace(/{days}/g, previewVariables.days)}
            </p>
          </div>
          <RecipientSelector
            selectedRecipients={recipients}
            onSelectRecipients={setRecipients}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {!previewMode && (
          <BlocksPalette onAddBlock={handleAddBlock} />
        )}

        <EmailCanvas
          blocks={blocks}
          selectedBlockId={previewMode ? null : selectedBlockId}
          onSelectBlock={previewMode ? () => {} : setSelectedBlockId}
          onUpdateBlocks={setBlocks}
          previewVariables={previewVariables}
        />

        {!previewMode && (
          <BlockEditor
            block={selectedBlock}
            onUpdateBlock={handleUpdateBlock}
          />
        )}
      </div>
    </div>
  );
}
