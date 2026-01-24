import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
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

  const { data: plan, error } = await supabase
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
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ plan });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
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
      is_active,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price_amount !== undefined) updateData.price_amount = price_amount;
    if (price_currency !== undefined) updateData.price_currency = price_currency;
    if (billing_interval !== undefined) updateData.billing_interval = billing_interval;
    if (features_manual !== undefined) updateData.features_manual = features_manual;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: plan, error } = await supabase
      .from('plan')
      .update(updateData)
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (e) {
    console.error('Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
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

  const { error } = await supabase
    .from('plan')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
