'use client'

import { useUser } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase-client'
import { useState } from 'react'

export default function TestAuthPage() {
  const { user } = useUser()
  const [token, setToken] = useState('')

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    setToken(data.session?.access_token || '')
  }

  if (!user) {
    return <div className="p-8">Please log in first</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Get Auth Token</h1>
      <button 
        onClick={getToken}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Get Token
      </button>
      {token && (
        <div className="mt-4">
          <p className="font-bold">Your token:</p>
          <textarea 
            className="w-full h-32 p-2 border rounded font-mono text-xs"
            value={token}
            readOnly
          />
          <p className="text-sm text-gray-600 mt-2">
            Copy this and use it in your API tests!
          </p>
        </div>
      )}
    </div>
  )
}