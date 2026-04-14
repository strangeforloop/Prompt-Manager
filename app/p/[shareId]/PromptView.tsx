'use client';

import { useState } from 'react';

type Prompt = {
  id: string
  title: string
  content: string
  tags: string[]
  share_description: string | null
  share_view_count: number
  share_import_count: number
  created_at: string
  updated_at: string
}

export default function PromptView({ prompt }: { prompt: Prompt }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-white">
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-sm font-medium tracking-tight text-gray-900 hover:text-gray-600 transition-colors">
            PromptVault
          </a>
          <span className="text-xs text-gray-400 font-light">Shared prompt</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Title block */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-snug mb-3">
            {prompt.title}
          </h1>
          {prompt.share_description && (
            <p className="text-base text-gray-500 font-light leading-relaxed">
              {prompt.share_description}
            </p>
          )}
        </div>

        {/* Prompt content card */}
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Prompt</span>
            <button
              onClick={handleCopy}
              className="text-xs font-medium px-3 py-1.5 rounded border transition-all duration-150"
              style={copied
                ? { background: '#111', color: '#fff', borderColor: '#111' }
                : { background: 'white', color: '#374151', borderColor: '#d1d5db' }
              }
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre
            className="px-5 py-5 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words overflow-x-auto"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}
          >
            {prompt.content}
          </pre>
        </div>

        {/* Footer row: tags + metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {prompt.tags && prompt.tags.length > 0
              ? prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                  >
                    {tag}
                  </span>
                ))
              : null}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-400 font-light whitespace-nowrap">
            <span>{formattedDate}</span>
            {prompt.share_view_count > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span>{prompt.share_view_count.toLocaleString()} {prompt.share_view_count === 1 ? 'view' : 'views'}</span>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
