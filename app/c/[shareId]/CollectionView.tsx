'use client'

import { useState } from 'react'

type Prompt = {
  id: string
  title: string
  content: string
  tags: string[]
  share_description: string | null
}

type Collection = {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
  updated_at: string
  prompts: Prompt[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
  )
}

export default function CollectionView({ collection }: { collection: Collection }) {
  const formattedDate = new Date(collection.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-sm font-medium tracking-tight text-gray-900 hover:text-gray-600 transition-colors">
            PromptVault
          </a>
          <span className="text-xs text-gray-400 font-light">Shared collection</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Collection header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            {collection.icon && <span className="text-2xl">{collection.icon}</span>}
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-snug">
              {collection.name}
            </h1>
          </div>
          {collection.description && (
            <p className="text-base text-gray-500 font-light leading-relaxed mb-4">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400 font-light">
            <span>{formattedDate}</span>
            <span className="text-gray-200">·</span>
            <span>{collection.prompts.length} {collection.prompts.length === 1 ? 'prompt' : 'prompts'}</span>
          </div>
        </div>

        {/* Prompts list */}
        <div className="space-y-6">
          {collection.prompts.map((prompt) => (
            <div key={prompt.id} className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
                <span className="text-sm font-medium text-gray-900 truncate mr-4">
                  {prompt.title}
                </span>
                <CopyButton text={prompt.content} />
              </div>
              <pre
                className="px-5 py-5 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words overflow-x-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}
              >
                {prompt.content}
              </pre>
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {collection.prompts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">
            This collection has no prompts yet.
          </p>
        )}
      </main>
    </div>
  )
}
