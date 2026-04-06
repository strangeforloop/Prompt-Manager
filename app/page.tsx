'use client'

import { useUser } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to PromptVault!</h1>
          
          <div className="space-y-2 mb-6">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.user_metadata?.full_name || 'Not provided'}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}