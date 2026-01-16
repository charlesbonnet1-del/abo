'use client';

import { EmailBlockType, blockMeta, blockTemplates, EmailBlock } from './types';

interface BlocksPaletteProps {
  onAddBlock: (block: EmailBlock) => void;
}

const blockTypes: EmailBlockType[] = [
  'header',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'columns',
  'social',
  'footer',
];

export function BlocksPalette({ onAddBlock }: BlocksPaletteProps) {
  const handleDragStart = (e: React.DragEvent, blockType: EmailBlockType) => {
    e.dataTransfer.setData('blockType', blockType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (blockType: EmailBlockType) => {
    const newBlock = blockTemplates[blockType]();
    onAddBlock(newBlock);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Blocs</h3>
      <p className="text-xs text-gray-500 mb-4">
        Cliquez ou glissez-deposez pour ajouter
      </p>

      <div className="space-y-2">
        {blockTypes.map((type) => {
          const meta = blockMeta[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              onClick={() => handleClick(type)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab hover:border-indigo-300 hover:bg-indigo-50 transition-colors active:cursor-grabbing"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-white rounded border border-gray-200 text-sm font-medium text-gray-600">
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                <p className="text-xs text-gray-500 truncate">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Variables</h4>
        <div className="flex flex-wrap gap-2">
          {['{name}', '{company}', '{plan}', '{email}'].map((variable) => (
            <span
              key={variable}
              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded cursor-pointer hover:bg-indigo-200"
              onClick={() => navigator.clipboard.writeText(variable)}
              title="Cliquez pour copier"
            >
              {variable}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Cliquez pour copier la variable
        </p>
      </div>
    </div>
  );
}
