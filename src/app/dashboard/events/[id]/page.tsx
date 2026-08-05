import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Ticket, Trophy, Shuffle } from 'lucide-react'
import EventDetailClient from './EventDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { count: ticketCount } = await supabase
    .from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', id)

  const { count: winnerCount } = await supabase
    .from('winners').select('*', { count: 'exact', head: true }).eq('event_id', id)

  return (
    <>
      <div className="top-header">
        <Link href="/dashboard/events" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Kembali
        </Link>
        <div style={{ flex: 1 }}>
          <div className="top-header-title">{event.nama}</div>
          <div className="top-header-sub">
            <span className="font-mono" style={{ fontSize: 12, background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>
              {event.kode_acara}
            </span>
            {' · '}
            {new Date(event.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="top-header-actions">
          <Link href={`/dashboard/draw/${event.id}`} className="btn btn-primary">
            <Shuffle size={15} /> Mulai Undian
          </Link>
        </div>
      </div>

      <div className="page-wrapper">
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-icon teal"><CalendarDays size={20} /></div>
            <div>
              <div className="stat-card-value">{new Date(event.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
              <div className="stat-card-label">Tanggal Event</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue"><Ticket size={20} /></div>
            <div>
              <div className="stat-card-value">{ticketCount ?? 0}</div>
              <div className="stat-card-label">Total Tiket</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon amber"><Trophy size={20} /></div>
            <div>
              <div className="stat-card-value">{winnerCount ?? 0}</div>
              <div className="stat-card-label">Pemenang</div>
            </div>
          </div>
        </div>

        {/* Client-side interactive sections */}
        <EventDetailClient event={event} initialTicketCount={ticketCount ?? 0} />
      </div>
    </>
  )
}
