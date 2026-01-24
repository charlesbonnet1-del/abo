import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
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

  const { data: features, error } = await supabase
    .from('product_feature')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ features });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
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

    if (!feature_key || !name) {
      return NextResponse.json(
        { error: 'feature_key and name are required' },
        { status: 400 }
      );
    }

    const { data: feature, error } = await supabase
      .from('product_feature')
      .insert({
        product_id: productId,
        feature_key,
        name,
        description_short,
        description_long,
        benefit,
        how_to_access,
        use_cases: use_cases || [],
        keywords: keywords || [],
        is_core: is_core !== undefined ? is_core : true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A feature with this key already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating feature:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature }, { status: 201 });
  } catch (e) {
    console.error('Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
