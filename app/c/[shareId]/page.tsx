import { notFound } from 'next/navigation';
import CollectionView from './CollectionView';

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export default async function SharedCollectionPage({
  params,
}: {
  params: { shareId: string }
}) {
  const res = await fetch(`${baseUrl}/api/collections/public/${params.shareId}`, {
    cache: 'no-store',
  })

  if (!res.ok) notFound()

  const collection = await res.json()
  return <CollectionView collection={collection} />
}
