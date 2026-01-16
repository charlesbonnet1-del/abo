// Email Block Types for Drag & Drop Builder

export type EmailBlockType =
  | 'header'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'social'
  | 'footer';

export interface EmailBlockBase {
  id: string;
  type: EmailBlockType;
}

export interface HeaderBlock extends EmailBlockBase {
  type: 'header';
  content: string;
  level: 'h1' | 'h2' | 'h3';
  align: 'left' | 'center' | 'right';
  color: string;
}

export interface TextBlock extends EmailBlockBase {
  type: 'text';
  content: string;
  align: 'left' | 'center' | 'right';
  fontSize: 'small' | 'medium' | 'large';
  color: string;
}

export interface ImageBlock extends EmailBlockBase {
  type: 'image';
  src: string;
  alt: string;
  width: 'full' | 'auto' | '50%' | '75%';
  align: 'left' | 'center' | 'right';
  link?: string;
}

export interface ButtonBlock extends EmailBlockBase {
  type: 'button';
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  align: 'left' | 'center' | 'right';
  fullWidth: boolean;
}

export interface DividerBlock extends EmailBlockBase {
  type: 'divider';
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  thickness: number;
}

export interface SpacerBlock extends EmailBlockBase {
  type: 'spacer';
  height: number;
}

export interface ColumnContent {
  blocks: EmailBlock[];
}

export interface ColumnsBlock extends EmailBlockBase {
  type: 'columns';
  columns: ColumnContent[];
  gap: 'small' | 'medium' | 'large';
}

export interface SocialBlock extends EmailBlockBase {
  type: 'social';
  networks: {
    type: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
    url: string;
    enabled: boolean;
  }[];
  align: 'left' | 'center' | 'right';
  iconSize: 'small' | 'medium' | 'large';
}

export interface FooterBlock extends EmailBlockBase {
  type: 'footer';
  companyName: string;
  address: string;
  unsubscribeText: string;
  showUnsubscribe: boolean;
}

export type EmailBlock =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock
  | SocialBlock
  | FooterBlock;

// Block Templates
export const blockTemplates: Record<EmailBlockType, () => EmailBlock> = {
  header: () => ({
    id: crypto.randomUUID(),
    type: 'header',
    content: 'Titre de section',
    level: 'h1',
    align: 'center',
    color: '#1f2937',
  }),
  text: () => ({
    id: crypto.randomUUID(),
    type: 'text',
    content: 'Votre texte ici. Utilisez {name}, {company}, {plan} pour les variables.',
    align: 'left',
    fontSize: 'medium',
    color: '#374151',
  }),
  image: () => ({
    id: crypto.randomUUID(),
    type: 'image',
    src: 'https://placehold.co/600x200/e5e7eb/9ca3af?text=Image',
    alt: 'Image description',
    width: 'full',
    align: 'center',
  }),
  button: () => ({
    id: crypto.randomUUID(),
    type: 'button',
    text: 'Cliquez ici',
    url: 'https://example.com',
    backgroundColor: '#4f46e5',
    textColor: '#ffffff',
    borderRadius: 'medium',
    align: 'center',
    fullWidth: false,
  }),
  divider: () => ({
    id: crypto.randomUUID(),
    type: 'divider',
    style: 'solid',
    color: '#e5e7eb',
    thickness: 1,
  }),
  spacer: () => ({
    id: crypto.randomUUID(),
    type: 'spacer',
    height: 24,
  }),
  columns: () => ({
    id: crypto.randomUUID(),
    type: 'columns',
    columns: [
      { blocks: [] },
      { blocks: [] },
    ],
    gap: 'medium',
  }),
  social: () => ({
    id: crypto.randomUUID(),
    type: 'social',
    networks: [
      { type: 'facebook', url: 'https://facebook.com', enabled: true },
      { type: 'twitter', url: 'https://twitter.com', enabled: true },
      { type: 'linkedin', url: 'https://linkedin.com', enabled: true },
      { type: 'instagram', url: 'https://instagram.com', enabled: false },
    ],
    align: 'center',
    iconSize: 'medium',
  }),
  footer: () => ({
    id: crypto.randomUUID(),
    type: 'footer',
    companyName: 'Abo',
    address: '123 rue de la Startup, 75001 Paris',
    unsubscribeText: 'Se desabonner',
    showUnsubscribe: true,
  }),
};

// Block metadata for the palette
export const blockMeta: Record<EmailBlockType, { label: string; icon: string; description: string }> = {
  header: {
    label: 'Titre',
    icon: 'H',
    description: 'Titre ou sous-titre',
  },
  text: {
    label: 'Texte',
    icon: 'T',
    description: 'Paragraphe de texte',
  },
  image: {
    label: 'Image',
    icon: '🖼',
    description: 'Image avec lien optionnel',
  },
  button: {
    label: 'Bouton',
    icon: '▢',
    description: 'Bouton call-to-action',
  },
  divider: {
    label: 'Separateur',
    icon: '—',
    description: 'Ligne horizontale',
  },
  spacer: {
    label: 'Espace',
    icon: '↕',
    description: 'Espace vertical',
  },
  columns: {
    label: 'Colonnes',
    icon: '⊞',
    description: 'Mise en page 2 colonnes',
  },
  social: {
    label: 'Reseaux',
    icon: '@',
    description: 'Icones reseaux sociaux',
  },
  footer: {
    label: 'Footer',
    icon: '⌄',
    description: 'Pied de page avec desabonnement',
  },
};

// Recipient types
export type RecipientType = 'segment' | 'cohort';

export interface EmailRecipient {
  type: RecipientType;
  id: string;
  name: string;
  count: number;
}
