import { createAuthenticatedClient, getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/search
export async function GET(request: NextRequest) {
    try {
        // Get current user
        const user = await getCurrentUser(request);

        if (!user) {
            return Response.json(
              { error: 'Unauthorized' },
              { status: 401 }
            )
        }

        // Create authenticated Supabase client
        const token = request.headers.get('authorization')?.replace('Bearer ', '')!
        const supabase = createAuthenticatedClient(token);

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const tags = searchParams.get('tags')?.split(',').filter(Boolean);
        const collection_id = searchParams.get('collection_id');
        const favorite = searchParams.get('favorite') === 'true';
        const sort = searchParams.get('sort') ?? 'recent';
        const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
        const offset = Number(searchParams.get('offset') ?? 0);

        let query = supabase
            .from('prompts')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);

        if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
        if (tags?.length) query = query.contains('tags', tags);
        if (collection_id) query = query.eq('collection_id', collection_id);
        if (favorite) query = query.eq('is_favorite', true);

        // Sorting
        if (sort === 'favorites') {
            query = query.order('is_favorite', { ascending: false }).order('created_at', { ascending: false });
        } else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.range(offset, offset + limit - 1);

        if (error) {
            console.error('Search error:', error);
            return Response.json({ error: 'Failed to search prompts' }, { status: 500 });
        }

        return Response.json({ data, limit, offset });

    } catch (error) {
        console.error('Search error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

