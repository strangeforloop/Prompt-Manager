'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState('Testing connection...')

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('_test').select('*').limit(1)
        
        if (error && error.code === '42P01') {
          // Table doesn't exist - this is expected, connection works!
          setStatus('✅ Connected to Supabase!')
        } else if (error) {
          setStatus(`❌ Error: ${error.message}`)
        } else {
          setStatus('✅ Connected to Supabase!')
        }
      } catch (err) {
        setStatus(`❌ Failed to connect: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p className="text-lg">{status}</p>
    </div>
  )
}