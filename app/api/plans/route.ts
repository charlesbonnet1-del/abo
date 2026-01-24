import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

  const { data: plans, error } = await supabase
    .from('plan')
    .select(`
      *,
      product (id, name),
      plan_feature (
        id,
        limit_value,
        limit_description,
        feature:product_feature (*)
      )
    `)
    .eq('user_id', user.id)
    .order('price_amount', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const {
      product_id,
      name,
      description,
      price_amount,
      price_currency,
      billing_interval,
      features_manual,
      stripe_product_id,
      stripe_price_id,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: plan, error } = await supabase
      .from('plan')
      .insert({
        user_id: user.id,
        product_id,
        name,
        description,
        price_amount: price_amount || 0,
        price_currency: price_currency || 'eur',
        billing_interval: billing_interval || 'month',
        features_manual: features_manual || [],
        stripe_product_id,
        stripe_price_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    console.error('Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
