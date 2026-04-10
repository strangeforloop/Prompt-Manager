import { getCurrentUser,  createAuthenticatedClient } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// POST /api/prompts
export async function POST(request: NextRequest) {
    try {
        // Get currrent user
        const user = await getCurrentUser(request);

        if (!user) {
            return Response.json(
                { error: 'Unknown user' },
                { status: 401 }
            );
        }

        // Create authenticated Supabase client
        const token = request.headers.get('authorization')?.replace('Bearer ', '')!;
        const supabase = createAuthenticatedClient(token);

        // Parse request
        const body = await request.json();
        const { title, content, tags, collection_id, is_favorite } = body;

        // Validate fields
        if (!title || !content) {
            return Response.json(
                { error: 'Tiitle and prompt are required' },
                { status: 400 }
            );
        }

        // Insert into database
        const { data, error } = await supabase
            .from('prompts')
            .insert({
                user_id: user.id,
                title,
                content,
                tags: tags || [],
                collection_id: collection_id || null,
                is_favorite: is_favorite || false,
            })
            .select()
            .single();

            if (error) {
                console.log('Database error:', error);
                return Response.json(
                    { error: 'Failed to create prompt' },
                    { status: 500 },
                );
            }

        // Return created prompt
        return Response.json(data, { status: 201 });
    } catch (error) {
        console.error('Create prompt error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }

};

// GET /api/prompts
export async function GET(request: NextRequest) {
    try {
        // Get current user
        const user = await getCurrentUser(request)

        if (!user) {
        return Response.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
        }

        // Create authenticated Supabase client
        const token = request.headers.get('authorization')?.replace('Bearer ', '')!
        const supabase = createAuthenticatedClient(token)

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const collection_id = searchParams.get('collection_id')
        const tag = searchParams.get('tag')
        const favorite = searchParams.get('favorite')
        const search = searchParams.get('search')

        // Build query
        let query = supabase
            .from('prompts')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null) // Only non-deleted prompts
            .order('created_at', { ascending: false })

        // Apply filters based on query params
        if (collection_id) {
            query = query.eq('collection_id', collection_id)
        }

        if (tag) {
            query = query.contains('tags', [tag])
        }

        if (favorite === 'true') {
            query = query.eq('is_favorite', true)
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
        }

        // Execute query
        const { data, error } = await query

        if (error) {
            console.error('Database error:', error)
            
            return Response.json(
                { error: 'Failed to fetch prompts' },
                { status: 500 }
            )
        }

        // Return prompts
        return Response.json({ prompts: data })

        } catch (error) {
        console.error('List prompts error:', error)
        return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
        )
    }
  }