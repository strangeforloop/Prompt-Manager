import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// OAuth callback handler
// gets code from user sign in via Google 
export async function GET(request: NextRequest) {
    // Search the request params for the code
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
}