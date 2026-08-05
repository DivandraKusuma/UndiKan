import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays, Shuffle, Ticket, Trophy } from 'lucide-react'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, kode_acara, nama, tanggal, status, deskripsi, created_at')
    .eq('created_by', user?.id)
    .order('created_at', { ascending: false })

  // Get ticket & winner counts for each event
  const eventIds = events?.map(e => e.id) ?? []

  const { data: ticketCounts } = await supabase
    .from('tickets')
    .select('event_id')
    .in('event_id', eventIds)

  const { data: winnerCounts } = await supabase
    .from('winners')
    .select('event_id')
    .in('event_id', eventIds)

  const tCountMap: Record<string, number> = {}
  const wCountMap: Record<string, number> = {}
  ticketCounts?.forEach(t => { tCountMap[t.event_id] = (tCountMap[t.event_id] ?? 0) + 1 })
  winnerCounts?.forEach(w => { wCountMap[w.event_id] = (wCountMap[w.event_id] ?? 0) + 1 })

  return (
    <>
      <div className="top-header">
        <div>
          <div className="top-header-title">Daftar Event</div>
          <div className="top-header-sub">Kelola semua event doorprize Anda</div>
        </div>
        <div className="top-header-actions ml-auto">
          <Link href="/dashboard/events/new" className="btn btn-primary">
            <Plus size={15} /> Buat Event
          </Link>
        </div>
      </div>

      <div className="page-wrapper">
        {!events || events.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><CalendarDays size={28} /></div>
              <div className="empty-state-title">Belum ada event</div>
              <div className="empty-state-desc">Buat event pertama Anda untuk mulai mengelola tiket dan undian</div>
              <Link href="/dashboard/events/new" className="btn btn-primary" style={{ marginTop: 12 }}>
                <Plus size={15} /> Buat Event Pertama
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {events.map(ev => (
              <div key={ev.id} className="event-card">
                <div className="event-card-header">
                  <div>
                    <div className="event-card-code">{ev.kode_acara}</div>
                    <div className="event-card-name" style={{ marginTop: 6 }}>{ev.nama}</div>
                  </div>
                  <span className={`badge ${ev.status === 'aktif' ? 'badge-success' : 'badge-gray'}`}>
                    {ev.status === 'aktif' ? 'Aktif' : 'Selesai'}
                  </span>
                </div>

                <div className="event-card-date">
                  <CalendarDays size={13} />
                  {new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                {ev.deskripsi && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }} className="truncate">
                    {ev.deskripsi}
                  </div>
                )}

                <div className="event-card-stats">
                  <div className="event-stat">
                    <div className="event-stat-value" style={{ color: 'var(--accent)' }}>{tCountMap[ev.id] ?? 0}</div>
                    <div className="event-stat-label">Tiket</div>
                  </div>
                  <div className="event-stat">
                    <div className="event-stat-value" style={{ color: 'var(--warning)' }}>{wCountMap[ev.id] ?? 0}</div>
                    <div className="event-stat-label">Pemenang</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link href={`/dashboard/events/${ev.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <Ticket size={13} /> Kelola
                  </Link>
                  <Link href={`/dashboard/draw/${ev.id}`} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                    <Shuffle size={13} /> Undi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
