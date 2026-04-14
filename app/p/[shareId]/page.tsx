import { notFound } from 'next/navigation'
import PromptView from './PromptView'

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

export default async function SharedPromptPage({
  params,
}: {
  params: { shareId: string }
}) {
  const res = await fetch(`${baseUrl}/api/prompts/public/${params.shareId}`, {
    cache: 'no-store',
  })

  if (!res.ok) notFound()

  const prompt = await res.json()
  return <PromptView prompt={prompt} />
}
