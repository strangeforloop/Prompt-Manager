import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: { shareId: string } }
) {
  const { shareId } = params

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('id, title, content, tags, share_description, share_visibility, share_view_count, share_import_count, created_at, updated_at')
    .eq('share_id', shareId)
    .eq('is_shared', true)
    .is('deleted_at', null)
    .single()

  if (error || !prompt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (prompt.share_visibility === 'private') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { share_visibility, ...publicPrompt } = prompt
  return NextResponse.json(publicPrompt)
}
