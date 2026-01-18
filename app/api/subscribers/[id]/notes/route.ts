import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

// Stub implementations for notes API
// These will be implemented when database integration is added

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[Stub] GET notes called for subscriber ${id}`);

  // Return empty array for now
  return NextResponse.json([]);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  console.log(`[Stub] POST note called for subscriber ${id}:`, content.trim());

  // Return a mock note for now
  const mockNote = {
    id: `note-${Date.now()}`,
    subscriberId: id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(mockNote, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('noteId');

  if (!noteId) {
    return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
  }

  console.log(`[Stub] DELETE note called for subscriber ${id}, note ${noteId}`);

  return NextResponse.json({ success: true });
}
