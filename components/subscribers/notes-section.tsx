'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

interface NotesSectionProps {
  subscriberId: string;
  notes: Note[];
}

export function NotesSection({ subscriberId, notes }: NotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/subscribers/${subscriberId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setContent('');
        setIsAdding(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        {!isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            + Ajouter une note
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter une note..."
            rows={3}
            className="mb-2"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setContent('');
              }}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      )}

      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <p className="text-sm text-gray-500 mb-1">
                {formatDate(note.createdAt)}
              </p>
              <p className="text-gray-700">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && <p className="text-gray-500 text-sm">Aucune note</p>
      )}
    </div>
  );
}
