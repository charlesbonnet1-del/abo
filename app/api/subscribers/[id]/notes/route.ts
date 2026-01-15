import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify subscriber belongs to user
  const subscriber = await prisma.subscriber.findFirst({
    where: {
      id,
      userId: dbUser.id,
    },
  });

  if (!subscriber) {
    return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
  }

  const notes = await prisma.note.findMany({
    where: { subscriberId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes);
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

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify subscriber belongs to user
  const subscriber = await prisma.subscriber.findFirst({
    where: {
      id,
      userId: dbUser.id,
    },
  });

  if (!subscriber) {
    return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Create note
  const note = await prisma.note.create({
    data: {
      subscriberId: id,
      content: content.trim(),
    },
  });

  // Also create an event for the note
  await prisma.event.create({
    data: {
      subscriberId: id,
      type: 'NOTE_ADDED',
      source: 'USER',
      data: { content: content.trim() },
    },
  });

  return NextResponse.json(note, { status: 201 });
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

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify subscriber belongs to user
  const subscriber = await prisma.subscriber.findFirst({
    where: {
      id,
      userId: dbUser.id,
    },
  });

  if (!subscriber) {
    return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
  }

  await prisma.note.delete({
    where: { id: noteId },
  });

  return NextResponse.json({ success: true });
}
