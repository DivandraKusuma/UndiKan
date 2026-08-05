import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DrawPageClient from './DrawPageClient'

interface Props { params: Promise<{ eventId: string }> }

export default async function DrawPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, nama, kode_acara')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  return <DrawPageClient event={event} />
}
