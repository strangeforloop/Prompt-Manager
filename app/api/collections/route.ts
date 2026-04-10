import { getCurrentUser, createAuthenticatedClient } from '@/lib/auth'
import { NextRequest } from 'next/server'

// POST /api/collections - Create new collection
export async function POST(request: NextRequest) {
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
    const { name, description, icon } = body

    // Validate required fields
    if (!name) {
      return Response.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Insert into database
    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        icon: icon || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      )
    }

    // Return created collection
    return Response.json(data, { status: 201 })

  } catch (error) {
    console.error('Create collection error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/collections - List all user's collections
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const include_prompts = searchParams.get('include_prompts') === 'true'

    // Build query
    let query = supabase
      .from('collections')
      .select(include_prompts ? '*, prompts(*)' : '*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      )
    }

    // If include_prompts, filter out deleted prompts
    if (include_prompts && data) {
      const collectionsWithActivePrompts = (data as unknown as Array<{ prompts?: { deleted_at?: string | null }[] } & Record<string, unknown>>).map(collection => ({
        ...collection,
        prompts: collection.prompts?.filter((p: any) => !p.deleted_at) || []
      }))
      return Response.json({ collections: collectionsWithActivePrompts })
    }

    // Return collections
    return Response.json({ collections: data })

  } catch (error) {
    console.error('List collections error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}