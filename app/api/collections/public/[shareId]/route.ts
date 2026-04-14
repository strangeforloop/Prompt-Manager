import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: { shareId: string } }
) {
  const { shareId } = params

  const { data: collection, error } = await supabase
    .from('collections')
    .select('id, name, description, icon, share_visibility, created_at, updated_at')
    .eq('share_id', shareId)
    .eq('is_shared', true)
    .single()

  if (error || !collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (collection.share_visibility === 'private') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, title, content, tags, share_description')
    .eq('collection_id', collection.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { share_visibility, ...publicCollection } = collection

  return NextResponse.json({
    ...publicCollection,
    prompts: prompts ?? [],
  })
}
