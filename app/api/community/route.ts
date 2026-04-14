import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// GET /api/community - no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') ?? 'all';
        const sort = searchParams.get('sort') ?? 'popular';
        const q = searchParams.get('q');
        const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
        const offset = Number(searchParams.get('offset') ?? 0);

        const results: { prompts?: any[]; collections?: any[] } = {};

        if (type === 'prompts' || type === 'all') {
            let promptQuery = supabase
                .from('prompts')
                .select('id, title, tags, share_id, share_description, created_at')
                .eq('is_shared', true)
                .eq('share_visibility', 'public')
                .is('deleted_at', null);

            if (q) promptQuery = promptQuery.ilike('title', `%${q}%`);

            promptQuery = promptQuery.order('created_at', { ascending: false });

            const { data, error } = await promptQuery.range(offset, offset + limit - 1);

            if (error) {
                console.error('Community prompts error:', error);
                return Response.json({ error: 'Failed to fetch community prompts' }, { status: 500 });
            }

            results.prompts = data;
        }

        if (type === 'collections' || type === 'all') {
            let collectionQuery = supabase
                .from('collections')
                .select('id, name, description, icon, share_id, share_description, created_at')
                .eq('is_shared', true)
                .eq('share_visibility', 'public');

            if (q) collectionQuery = collectionQuery.ilike('name', `%${q}%`);

            collectionQuery = collectionQuery.order('created_at', { ascending: false });

            const { data, error } = await collectionQuery.range(offset, offset + limit - 1);

            if (error) {
                console.error('Community collections error:', error);
                return Response.json({ error: 'Failed to fetch community collections' }, { status: 500 });
            }

            results.collections = data;
        }

        return Response.json({ ...results, limit, offset });

    } catch (error) {
        console.error('Community error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
