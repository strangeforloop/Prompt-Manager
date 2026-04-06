import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

/**
 * Resolve the current user from an incoming request.
 *
 * @param request - HTTP `Request` (e.g. from a Route Handler)
 * @returns Application `User`, or `null` if unauthenticated / invalid token
 */
export async function getCurrentUser(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice("Bearer ".length).trim();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;

    // TODO: map auth user + profile table to app-level User shape.
    return {
      id: user.id,
      email: user.email ?? "",
      username:
        (user.user_metadata?.username as string | undefined) ?? user.email ?? "",
      created_at: user.created_at ?? new Date().toISOString(),
    };
  } catch (error) {
    console.log("Auth Error", error);
    return null;
  }
}
