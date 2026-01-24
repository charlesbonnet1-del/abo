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

  // Verify plan belongs to user
  const { data: plan, error: planError } = await supabase
    .from('plan')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const { data: planFeatures, error } = await supabase
    .from('plan_feature')
    .select(`
      *,
      feature:product_feature (*)
    `)
    .eq('plan_id', planId);

  if (error) {
    console.error('Error fetching plan features:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ planFeatures });
}

export async function POST(
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

  // Verify plan belongs to user
  const { data: plan, error: planError } = await supabase
    .from('plan')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { feature_id, limit_value, limit_description } = body;

    if (!feature_id) {
      return NextResponse.json({ error: 'feature_id is required' }, { status: 400 });
    }

    const { data: planFeature, error } = await supabase
      .from('plan_feature')
      .insert({
        plan_id: planId,
        feature_id,
        limit_value,
        limit_description,
      })
      .select(`
        *,
        feature:product_feature (*)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This feature is already linked to the plan' },
          { status: 409 }
        );
      }
      console.error('Error creating plan feature:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ planFeature }, { status: 201 });
  } catch (e) {
    console.error('Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
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

  // Verify plan belongs to user
  const { data: plan, error: planError } = await supabase
    .from('plan')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { plan_feature_id, limit_value, limit_description } = body;

    if (!plan_feature_id) {
      return NextResponse.json({ error: 'plan_feature_id is required' }, { status: 400 });
    }

    const { data: planFeature, error } = await supabase
      .from('plan_feature')
      .update({
        limit_value,
        limit_description,
      })
      .eq('id', plan_feature_id)
      .eq('plan_id', planId)
      .select(`
        *,
        feature:product_feature (*)
      `)
      .single();

    if (error) {
      console.error('Error updating plan feature:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ planFeature });
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

  // Verify plan belongs to user
  const { data: plan, error: planError } = await supabase
    .from('plan')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const featureId = url.searchParams.get('feature_id');

  if (!featureId) {
    return NextResponse.json({ error: 'feature_id query param is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('plan_feature')
    .delete()
    .eq('plan_id', planId)
    .eq('feature_id', featureId);

  if (error) {
    console.error('Error deleting plan feature:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
