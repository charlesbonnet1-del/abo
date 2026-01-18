'use client';

import { useState } from 'react';
import {
  EmailBlock,
  EmailBlockType,
  blockTemplates,
  HeaderBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  FooterBlock,
} from './types';

interface EmailCanvasProps {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateBlocks: (blocks: EmailBlock[]) => void;
  previewVariables: Record<string, string>;
  showPoweredBy?: boolean;
  userPlan?: 'free' | 'starter' | 'growth' | 'team' | 'scale';
}

export function EmailCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlocks,
  previewVariables,
  showPoweredBy = true,
  userPlan = 'starter',
}: EmailCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    const blockType = e.dataTransfer.getData('blockType') as EmailBlockType;
    const draggedBlockId = e.dataTransfer.getData('blockId');

    if (blockType) {
      // Adding new block from palette
      const newBlock = blockTemplates[blockType]();
      const newBlocks = [...blocks];
      newBlocks.splice(index, 0, newBlock);
      onUpdateBlocks(newBlocks);
      onSelectBlock(newBlock.id);
    } else if (draggedBlockId) {
      // Reordering existing block
      const oldIndex = blocks.findIndex((b) => b.id === draggedBlockId);
      if (oldIndex !== -1 && oldIndex !== index) {
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(oldIndex, 1);
        const adjustedIndex = oldIndex < index ? index - 1 : index;
        newBlocks.splice(adjustedIndex, 0, removed);
        onUpdateBlocks(newBlocks);
      }
    }
  };

  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdateBlocks(blocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      onSelectBlock(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex !== -1) {
      const block = blocks[blockIndex];
      const duplicated = { ...block, id: crypto.randomUUID() };
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, duplicated as EmailBlock);
      onUpdateBlocks(newBlocks);
      onSelectBlock(duplicated.id);
    }
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onUpdateBlocks(newBlocks);
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(previewVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        {/* Email preview container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Email header simulation */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">De:</span>
              <span>noreply@abo.app</span>
            </div>
          </div>

          {/* Email content */}
          <div
            className="min-h-[400px] p-6"
            onDragOver={(e) => handleDragOver(e, blocks.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, blocks.length)}
          >
            {blocks.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg transition-colors ${
                  dragOverIndex === 0 ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
                }`}
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-gray-500 text-center">
                  Glissez des blocs ici<br />
                  <span className="text-sm text-gray-400">ou cliquez sur un bloc pour l&apos;ajouter</span>
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {blocks.map((block, index) => (
                  <div key={block.id}>
                    {/* Drop zone before block */}
                    <div
                      className={`h-2 transition-all ${
                        dragOverIndex === index ? 'h-8 bg-indigo-100 border-2 border-dashed border-indigo-400 rounded' : ''
                      }`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                    />

                    {/* Block */}
                    <div
                      draggable
                      onDragStart={(e) => handleBlockDragStart(e, block.id)}
                      onClick={() => onSelectBlock(block.id)}
                      className={`relative group cursor-pointer transition-all ${
                        selectedBlockId === block.id
                          ? 'ring-2 ring-indigo-500 ring-offset-2 rounded'
                          : 'hover:ring-1 hover:ring-gray-300 rounded'
                      }`}
                    >
                      {/* Block toolbar */}
                      <div
                        className={`absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-gray-900 rounded-lg px-2 py-1 z-10 transition-opacity ${
                          selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 text-white hover:bg-gray-700 rounded disabled:opacity-30"
                          title="Monter"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'down');
                          }}
                          disabled={index === blocks.length - 1}
                          className="p-1 text-white hover:bg-gray-700 rounded disabled:opacity-30"
                          title="Descendre"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateBlock(block.id);
                          }}
                          className="p-1 text-white hover:bg-gray-700 rounded"
                          title="Dupliquer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
                          className="p-1 text-red-400 hover:bg-red-900 hover:text-red-300 rounded"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Block content */}
                      <BlockRenderer block={block} replaceVariables={replaceVariables} />
                    </div>
                  </div>
                ))}

                {/* Drop zone at end */}
                <div
                  className={`h-2 transition-all ${
                    dragOverIndex === blocks.length ? 'h-8 bg-indigo-100 border-2 border-dashed border-indigo-400 rounded' : ''
                  }`}
                />
              </div>
            )}
          </div>

          {/* Powered by Abo footer */}
          {showPoweredBy && (
            <PoweredByAbo userPlan={userPlan} />
          )}
        </div>
      </div>
    </div>
  );
}

// Powered by Abo Footer Component
function PoweredByAbo({ userPlan }: { userPlan: 'free' | 'starter' | 'growth' | 'team' | 'scale' }) {
  const isMandatory = userPlan === 'free' || userPlan === 'starter';

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-center gap-2">
        <a
          href="https://abo.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xs font-medium">Powered by Abo</span>
        </a>
        {isMandatory && (
          <span className="text-xs text-gray-400 ml-2" title="Passez au plan Growth pour retirer ce badge">
            (obligatoire)
          </span>
        )}
      </div>
      {isMandatory && (
        <p className="text-center text-xs text-gray-400 mt-1">
          <a href="/settings/billing" className="underline hover:text-gray-600">
            Passez a Growth
          </a>
          {' '}pour retirer ce badge
        </p>
      )}
    </div>
  );
}

// Block Renderer Component
interface BlockRendererProps {
  block: EmailBlock;
  replaceVariables: (text: string) => string;
}

function BlockRenderer({ block, replaceVariables }: BlockRendererProps) {
  switch (block.type) {
    case 'header':
      return <HeaderBlockRenderer block={block} replaceVariables={replaceVariables} />;
    case 'text':
      return <TextBlockRenderer block={block} replaceVariables={replaceVariables} />;
    case 'image':
      return <ImageBlockRenderer block={block} />;
    case 'button':
      return <ButtonBlockRenderer block={block} replaceVariables={replaceVariables} />;
    case 'divider':
      return <DividerBlockRenderer block={block} />;
    case 'spacer':
      return <SpacerBlockRenderer block={block} />;
    case 'social':
      return <SocialBlockRenderer block={block} />;
    case 'footer':
      return <FooterBlockRenderer block={block} />;
    default:
      return <div className="p-4 bg-gray-100 text-gray-500">Bloc non reconnu</div>;
  }
}

function HeaderBlockRenderer({ block, replaceVariables }: { block: HeaderBlock; replaceVariables: (text: string) => string }) {
  const Tag = block.level;
  const sizes = { h1: 'text-3xl', h2: 'text-2xl', h3: 'text-xl' };
  const aligns = { left: 'text-left', center: 'text-center', right: 'text-right' };

  return (
    <div className="py-4">
      <Tag
        className={`font-bold ${sizes[block.level]} ${aligns[block.align]}`}
        style={{ color: block.color }}
      >
        {replaceVariables(block.content)}
      </Tag>
    </div>
  );
}

function TextBlockRenderer({ block, replaceVariables }: { block: TextBlock; replaceVariables: (text: string) => string }) {
  const sizes = { small: 'text-sm', medium: 'text-base', large: 'text-lg' };
  const aligns = { left: 'text-left', center: 'text-center', right: 'text-right' };

  return (
    <div className="py-3">
      <p
        className={`${sizes[block.fontSize]} ${aligns[block.align]} whitespace-pre-wrap`}
        style={{ color: block.color }}
      >
        {replaceVariables(block.content)}
      </p>
    </div>
  );
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const widths = { full: '100%', auto: 'auto', '50%': '50%', '75%': '75%' };
  const aligns = { left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' };

  return (
    <div className="py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.src}
        alt={block.alt}
        className={`${aligns[block.align]} rounded`}
        style={{ width: widths[block.width], maxWidth: '100%' }}
      />
    </div>
  );
}

function ButtonBlockRenderer({ block, replaceVariables }: { block: ButtonBlock; replaceVariables: (text: string) => string }) {
  const aligns = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
  const radii = { none: 'rounded-none', small: 'rounded', medium: 'rounded-lg', large: 'rounded-xl', full: 'rounded-full' };

  return (
    <div className={`py-4 flex ${aligns[block.align]}`}>
      <button
        className={`px-6 py-3 font-medium transition-opacity hover:opacity-90 ${radii[block.borderRadius]} ${block.fullWidth ? 'w-full' : ''}`}
        style={{ backgroundColor: block.backgroundColor, color: block.textColor }}
      >
        {replaceVariables(block.text)}
      </button>
    </div>
  );
}

function DividerBlockRenderer({ block }: { block: DividerBlock }) {
  return (
    <div className="py-4">
      <hr
        style={{
          borderStyle: block.style,
          borderColor: block.color,
          borderWidth: `${block.thickness}px 0 0 0`,
        }}
      />
    </div>
  );
}

function SpacerBlockRenderer({ block }: { block: SpacerBlock }) {
  return <div style={{ height: `${block.height}px` }} className="bg-gray-50/50" />;
}

function SocialBlockRenderer({ block }: { block: SocialBlock }) {
  const aligns = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
  const sizes = { small: 'w-6 h-6', medium: 'w-8 h-8', large: 'w-10 h-10' };

  const icons: Record<string, string> = {
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    twitter: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    instagram: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
  };

  return (
    <div className={`py-4 flex ${aligns[block.align]} gap-4`}>
      {block.networks
        .filter((n) => n.enabled)
        .map((network) => (
          <a
            key={network.type}
            href={network.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizes[block.iconSize]} text-gray-600 hover:text-gray-800 transition-colors`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d={icons[network.type]} />
            </svg>
          </a>
        ))}
    </div>
  );
}

function FooterBlockRenderer({ block }: { block: FooterBlock }) {
  return (
    <div className="py-6 text-center border-t border-gray-200 mt-4">
      <p className="text-sm text-gray-600 font-medium">{block.companyName}</p>
      <p className="text-xs text-gray-500 mt-1">{block.address}</p>
      {block.showUnsubscribe && (
        <p className="text-xs text-gray-400 mt-3">
          <a href="#" className="underline hover:text-gray-600">
            {block.unsubscribeText}
          </a>
        </p>
      )}
    </div>
  );
}
