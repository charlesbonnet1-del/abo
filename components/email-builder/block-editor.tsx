'use client';

import {
  EmailBlock,
  HeaderBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  FooterBlock,
  blockMeta,
} from './types';

interface BlockEditorProps {
  block: EmailBlock | null;
  onUpdateBlock: (block: EmailBlock) => void;
}

export function BlockEditor({ block, onUpdateBlock }: BlockEditorProps) {
  if (!block) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <p className="text-sm text-center">
            Selectionnez un bloc<br />pour le modifier
          </p>
        </div>
      </div>
    );
  }

  const meta = blockMeta[block.type];

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h3 className="font-semibold text-gray-900">{meta.label}</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {block.type === 'header' && (
          <HeaderEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'text' && (
          <TextEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'image' && (
          <ImageEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'button' && (
          <ButtonEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'divider' && (
          <DividerEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'spacer' && (
          <SpacerEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'social' && (
          <SocialEditor block={block} onUpdate={onUpdateBlock} />
        )}
        {block.type === 'footer' && (
          <FooterEditor block={block} onUpdate={onUpdateBlock} />
        )}
      </div>
    </div>
  );
}

// Shared components
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Input({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
  );
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
      />
    </div>
  );
}

function AlignSelect({ value, onChange }: { value: 'left' | 'center' | 'right'; onChange: (v: 'left' | 'center' | 'right') => void }) {
  return (
    <div className="flex gap-1">
      {(['left', 'center', 'right'] as const).map((align) => (
        <button
          key={align}
          onClick={() => onChange(align)}
          className={`flex-1 p-2 rounded border ${
            value === align
              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {align === 'left' && (
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          )}
          {align === 'center' && (
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          )}
          {align === 'right' && (
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// Block-specific editors
function HeaderEditor({ block, onUpdate }: { block: HeaderBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>Contenu</Label>
        <Input
          value={block.content}
          onChange={(content) => onUpdate({ ...block, content })}
          placeholder="Titre..."
        />
      </div>
      <div>
        <Label>Niveau</Label>
        <Select
          value={block.level}
          onChange={(level) => onUpdate({ ...block, level })}
          options={[
            { value: 'h1', label: 'H1 - Grand titre' },
            { value: 'h2', label: 'H2 - Titre moyen' },
            { value: 'h3', label: 'H3 - Petit titre' },
          ]}
        />
      </div>
      <div>
        <Label>Alignement</Label>
        <AlignSelect value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
      </div>
      <div>
        <Label>Couleur</Label>
        <ColorInput value={block.color} onChange={(color) => onUpdate({ ...block, color })} />
      </div>
    </>
  );
}

function TextEditor({ block, onUpdate }: { block: TextBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>Contenu</Label>
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ ...block, content: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Votre texte..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Variables: {'{name}'}, {'{company}'}, {'{plan}'}
        </p>
      </div>
      <div>
        <Label>Taille</Label>
        <Select
          value={block.fontSize}
          onChange={(fontSize) => onUpdate({ ...block, fontSize })}
          options={[
            { value: 'small', label: 'Petit' },
            { value: 'medium', label: 'Moyen' },
            { value: 'large', label: 'Grand' },
          ]}
        />
      </div>
      <div>
        <Label>Alignement</Label>
        <AlignSelect value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
      </div>
      <div>
        <Label>Couleur</Label>
        <ColorInput value={block.color} onChange={(color) => onUpdate({ ...block, color })} />
      </div>
    </>
  );
}

function ImageEditor({ block, onUpdate }: { block: ImageBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>URL de l&apos;image</Label>
        <Input
          value={block.src}
          onChange={(src) => onUpdate({ ...block, src })}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label>Texte alternatif</Label>
        <Input
          value={block.alt}
          onChange={(alt) => onUpdate({ ...block, alt })}
          placeholder="Description de l'image"
        />
      </div>
      <div>
        <Label>Largeur</Label>
        <Select
          value={block.width}
          onChange={(width) => onUpdate({ ...block, width })}
          options={[
            { value: 'full', label: '100%' },
            { value: '75%', label: '75%' },
            { value: '50%', label: '50%' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
      </div>
      <div>
        <Label>Alignement</Label>
        <AlignSelect value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
      </div>
      <div>
        <Label>Lien (optionnel)</Label>
        <Input
          value={block.link || ''}
          onChange={(link) => onUpdate({ ...block, link: link || undefined })}
          placeholder="https://..."
        />
      </div>
    </>
  );
}

function ButtonEditor({ block, onUpdate }: { block: ButtonBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>Texte du bouton</Label>
        <Input
          value={block.text}
          onChange={(text) => onUpdate({ ...block, text })}
          placeholder="Cliquez ici"
        />
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={block.url}
          onChange={(url) => onUpdate({ ...block, url })}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label>Couleur de fond</Label>
        <ColorInput
          value={block.backgroundColor}
          onChange={(backgroundColor) => onUpdate({ ...block, backgroundColor })}
        />
      </div>
      <div>
        <Label>Couleur du texte</Label>
        <ColorInput
          value={block.textColor}
          onChange={(textColor) => onUpdate({ ...block, textColor })}
        />
      </div>
      <div>
        <Label>Arrondi</Label>
        <Select
          value={block.borderRadius}
          onChange={(borderRadius) => onUpdate({ ...block, borderRadius })}
          options={[
            { value: 'none', label: 'Aucun' },
            { value: 'small', label: 'Petit' },
            { value: 'medium', label: 'Moyen' },
            { value: 'large', label: 'Grand' },
            { value: 'full', label: 'Complet' },
          ]}
        />
      </div>
      <div>
        <Label>Alignement</Label>
        <AlignSelect value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={block.fullWidth}
            onChange={(e) => onUpdate({ ...block, fullWidth: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Pleine largeur</span>
        </label>
      </div>
    </>
  );
}

function DividerEditor({ block, onUpdate }: { block: DividerBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>Style</Label>
        <Select
          value={block.style}
          onChange={(style) => onUpdate({ ...block, style })}
          options={[
            { value: 'solid', label: 'Solide' },
            { value: 'dashed', label: 'Tirets' },
            { value: 'dotted', label: 'Points' },
          ]}
        />
      </div>
      <div>
        <Label>Couleur</Label>
        <ColorInput value={block.color} onChange={(color) => onUpdate({ ...block, color })} />
      </div>
      <div>
        <Label>Epaisseur ({block.thickness}px)</Label>
        <input
          type="range"
          min="1"
          max="5"
          value={block.thickness}
          onChange={(e) => onUpdate({ ...block, thickness: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>
    </>
  );
}

function SpacerEditor({ block, onUpdate }: { block: SpacerBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <div>
      <Label>Hauteur ({block.height}px)</Label>
      <input
        type="range"
        min="8"
        max="80"
        step="8"
        value={block.height}
        onChange={(e) => onUpdate({ ...block, height: parseInt(e.target.value) })}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>8px</span>
        <span>80px</span>
      </div>
    </div>
  );
}

function SocialEditor({ block, onUpdate }: { block: SocialBlock; onUpdate: (b: EmailBlock) => void }) {
  const updateNetwork = (index: number, updates: Partial<(typeof block.networks)[0]>) => {
    const newNetworks = [...block.networks];
    newNetworks[index] = { ...newNetworks[index], ...updates };
    onUpdate({ ...block, networks: newNetworks });
  };

  return (
    <>
      <div>
        <Label>Reseaux sociaux</Label>
        <div className="space-y-3">
          {block.networks.map((network, index) => (
            <div key={network.type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={network.enabled}
                onChange={(e) => updateNetwork(index, { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700 capitalize w-20">{network.type}</span>
              <input
                type="text"
                value={network.url}
                onChange={(e) => updateNetwork(index, { url: e.target.value })}
                placeholder="URL"
                disabled={!network.enabled}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Alignement</Label>
        <AlignSelect value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
      </div>
      <div>
        <Label>Taille des icones</Label>
        <Select
          value={block.iconSize}
          onChange={(iconSize) => onUpdate({ ...block, iconSize })}
          options={[
            { value: 'small', label: 'Petit' },
            { value: 'medium', label: 'Moyen' },
            { value: 'large', label: 'Grand' },
          ]}
        />
      </div>
    </>
  );
}

function FooterEditor({ block, onUpdate }: { block: FooterBlock; onUpdate: (b: EmailBlock) => void }) {
  return (
    <>
      <div>
        <Label>Nom de l&apos;entreprise</Label>
        <Input
          value={block.companyName}
          onChange={(companyName) => onUpdate({ ...block, companyName })}
        />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input
          value={block.address}
          onChange={(address) => onUpdate({ ...block, address })}
        />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={block.showUnsubscribe}
            onChange={(e) => onUpdate({ ...block, showUnsubscribe: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <span className="text-sm text-gray-700">Afficher le lien de desabonnement</span>
        </label>
      </div>
      {block.showUnsubscribe && (
        <div>
          <Label>Texte du lien</Label>
          <Input
            value={block.unsubscribeText}
            onChange={(unsubscribeText) => onUpdate({ ...block, unsubscribeText })}
          />
        </div>
      )}
    </>
  );
}
