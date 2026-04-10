import { getCurrentUser, createAuthenticatedClient } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/collections/:id - Get single collection with prompts
export async function GET(
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

    // Create authenticated Supabase client
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const supabase = createAuthenticatedClient(token)

    // Fetch collection with prompts
    const { data: collection, error } = await supabase
      .from('collections')
      .select(`
        *,
        prompts (
          id,
          title,
          content,
          tags,
          is_favorite,
          use_count,
          last_used_at,
          created_at,
          updated_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !collection) {
      return Response.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Filter out deleted prompts
    if (collection.prompts) {
      collection.prompts = collection.prompts.filter((p: any) => !p.deleted_at)
    }

    // Return collection
    return Response.json(collection)

  } catch (error) {
    console.error('Get collection error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/collections/:id - Update collection
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

    // Create authenticated Supabase client
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const supabase = createAuthenticatedClient(token)

    // Parse request body
    const body = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'description', 'icon']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Validate name if provided
    if ('name' in updateData && !updateData.name) {
      return Response.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update in database
    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      )
    }

    if (!data) {
      return Response.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Return updated collection
    return Response.json(data)

  } catch (error) {
    console.error('Update collection error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/collections/:id - Delete collection (hard delete)
export async function DELETE(
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

    // Create authenticated Supabase client
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const supabase = createAuthenticatedClient(token)

    // Delete collection
    // ON DELETE SET NULL constraint will automatically set
    // collection_id to NULL for all prompts in this collection
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Extra safety check

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to delete collection' },
        { status: 500 }
      )
    }

    // Return success
    return Response.json({ 
      message: 'Collection deleted successfully' 
    })

  } catch (error) {
    console.error('Delete collection error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}