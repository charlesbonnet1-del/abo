import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; featureId: string }> }
) {
  const { productId, featureId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product belongs to user
  const { data: product, error: productError } = await supabase
    .from('product')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { data: feature, error } = await supabase
    .from('product_feature')
    .select('*')
    .eq('id', featureId)
    .eq('product_id', productId)
    .single();

  if (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ feature });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; featureId: string }> }
) {
  const { productId, featureId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product belongs to user
  const { data: product, error: productError } = await supabase
    .from('product')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      feature_key,
      name,
      description_short,
      description_long,
      benefit,
      how_to_access,
      use_cases,
      keywords,
      is_core,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (feature_key !== undefined) updateData.feature_key = feature_key;
    if (name !== undefined) updateData.name = name;
    if (description_short !== undefined) updateData.description_short = description_short;
    if (description_long !== undefined) updateData.description_long = description_long;
    if (benefit !== undefined) updateData.benefit = benefit;
    if (how_to_access !== undefined) updateData.how_to_access = how_to_access;
    if (use_cases !== undefined) updateData.use_cases = use_cases;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (is_core !== undefined) updateData.is_core = is_core;

    const { data: feature, error } = await supabase
      .from('product_feature')
      .update(updateData)
      .eq('id', featureId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A feature with this key already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating feature:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature });
  } catch (e) {
    console.error('Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; featureId: string }> }
) {
  const { productId, featureId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product belongs to user
  const { data: product, error: productError } = await supabase
    .from('product')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('product_feature')
    .delete()
    .eq('id', featureId)
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
