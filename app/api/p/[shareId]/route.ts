import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const { shareId } = params;

  // Get all prompts that are shared with the public and not deleted
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('title, content, tags, share_description, created_at, use_count')
      .eq('share_id', shareId)
      .eq('is_shared', true)
      .eq('share_visibility', 'public')
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
