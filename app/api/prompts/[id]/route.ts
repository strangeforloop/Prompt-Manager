import { createAuthenticatedClient, getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// GET /api/prompts/:id
export async function GET(request: NextRequest, { params }: { params: { id: string }}) {
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
        const supabase = createAuthenticatedClient(token)

        // Fetch prompt
        const { data: prompt, error } = await supabase
            .from('prompts')
            .select('*')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (error || !prompt) {
            return Response.json(
                { error: 'Prompt not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (prompt.user_id !== user.id) {
            return Response.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Return prompt
        return Response.json(prompt);

    } catch (error) {
        return Response.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }
}

// PATCH /api/prompts/:id - Update prompt
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
        // Get current user
        const user = await getCurrentUser(request)

        if (!user) {
            return Response.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        //Create authenticated Supabase client
        const token = request.headers.get('authorization')?.replace('Bearer ', '')!;
        const supabase = createAuthenticatedClient(token);

        // Verify ownership FIRST (before updating)
        const { data: existing, error: fetchError } = await supabase
            .from('prompts')
            .select('user_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single();
  
        if (fetchError || !existing) {
            return Response.json(
                { error: 'Prompt not found' },
                { status: 404 }
            );
        }

        if (existing.user_id !== user.id) {
            return Response.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Only allow updating certain fields
        const allowedFields = [
            'title',
            'content',
            'tags',
            'collection_id',
            'is_favorite'
        ];

        const updateData: any = {}
        for (const field of allowedFields) {
            if (field in body) {
                updateData[field] = body[field]
            }
        }

        // Always update the updated_at timestamp
        updateData.updated_at = new Date().toISOString()

        // Update in database
        const { data, error } = await supabase
            .from('prompts')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return Response.json(
                { error: 'Failed to update prompt' },
                { status: 500 }
            )
        }

        // Return updated prompt
        return Response.json(data)

    } catch (error) {
        console.error('Update prompt error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
  }
  
  // DELETE /api/prompts/:id - Soft delete prompt
  export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
        // Get current user
        const user = await getCurrentUser(request);

        if (!user) {
            return Response.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Create authenticated Supabase client
        const token = request.headers.get('authorization')?.replace('Bearer ', '')!
        const supabase = createAuthenticatedClient(token)

        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from('prompts')
            .select('user_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !existing) {
            return Response.json(
                { error: 'Prompt not found' },
                { status: 404 }
            );
        }

        if (existing.user_id !== user.id) {
            return Response.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Soft delete (set deleted_at timestamp)
        const { error } = await supabase
            .from('prompts')
            .update({ 
                deleted_at: new Date().toISOString() 
            })
            .eq('id', params.id);

        if (error) {
            console.error('Database error:', error)
            return Response.json(
                { error: 'Failed to delete prompt' },
                { status: 500 }
            );
        }

        // Return success
        return Response.json({ 
            message: 'Prompt deleted successfully' 
        });

        } catch (error) {
            console.error('Delete prompt error:', error)
            return Response.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
  }