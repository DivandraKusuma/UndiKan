import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, Ticket, Trophy, Plus, Shuffle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats
  const { data: events } = await supabase
    .from('events')
    .select('id, nama, kode_acara, status, tanggal, created_at')
    .eq('created_by', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allUserEvents } = await supabase
    .from('events')
    .select('id, status')
    .eq('created_by', user?.id)

  const eventIds = allUserEvents?.map(e => e.id) || []
  const activeEvents = allUserEvents?.filter(e => e.status === 'aktif').length || 0
  const totalEvents = eventIds.length

  const { count: totalTickets } = eventIds.length > 0 ? await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('event_id', eventIds) : { count: 0 }

  const { count: totalWinners } = eventIds.length > 0 ? await supabase
    .from('winners')
    .select('*', { count: 'exact', head: true })
    .in('event_id', eventIds) : { count: 0 }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat pagi'
    if (hour < 17) return 'Selamat siang'
    return 'Selamat malam'
  }

  const displayName = user?.email?.split('@')[0] || 'EO'

  return (
    <>
      {/* Header */}
      <div className="top-header">
        <div>
          <div className="top-header-title">{greeting()}, {displayName}!</div>
          <div className="top-header-sub">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="top-header-actions ml-auto">
          <Link href="/dashboard/events/new" className="btn btn-primary">
            <Plus size={15} /> Buat Event
          </Link>
        </div>
      </div>

      <div className="page-wrapper">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-icon teal"><CalendarDays size={20} /></div>
            <div>
              <div className="stat-card-value">{totalEvents ?? 0}</div>
              <div className="stat-card-label">Total Event</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green"><CalendarDays size={20} /></div>
            <div>
              <div className="stat-card-value">{activeEvents ?? 0}</div>
              <div className="stat-card-label">Event Aktif</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue"><Ticket size={20} /></div>
            <div>
              <div className="stat-card-value">{totalTickets ?? 0}</div>
              <div className="stat-card-label">Total Tiket</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon amber"><Trophy size={20} /></div>
            <div>
              <div className="stat-card-value">{totalWinners ?? 0}</div>
              <div className="stat-card-label">Pemenang</div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Event Terbaru</div>
              <div className="card-subtitle">5 event terakhir yang dibuat</div>
            </div>
            <Link href="/dashboard/events" className="btn btn-secondary btn-sm">
              Lihat Semua
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {!events || events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><CalendarDays size={24} /></div>
                <div className="empty-state-title">Belum ada event</div>
                <div className="empty-state-desc">Mulai dengan membuat event pertama Anda</div>
                <Link href="/dashboard/events/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                  <Plus size={14} /> Buat Event Pertama
                </Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Kode Acara</th>
                      <th>Nama Event</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.id}>
                        <td>
                          <span className="font-mono" style={{ fontSize: 12, background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {ev.kode_acara}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{ev.nama}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span className={`badge ${ev.status === 'aktif' ? 'badge-success' : 'badge-gray'}`}>
                            {ev.status === 'aktif' ? '● Aktif' : '✓ Selesai'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/dashboard/events/${ev.id}`} className="btn btn-secondary btn-sm">
                              Detail
                            </Link>
                            <Link href={`/dashboard/draw/${ev.id}`} className="btn btn-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                              <Shuffle size={13} /> Undi
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid-3" style={{ marginTop: 20 }}>
          <Link href="/dashboard/events/new" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="stat-card-icon teal" style={{ width: 48, height: 48, flexShrink: 0 }}>
                <Plus size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Buat Event Baru</div>
                <div className="text-muted text-sm">Tambah event & tiket peserta</div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/events" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="stat-card-icon blue" style={{ width: 48, height: 48, flexShrink: 0 }}>
                <Ticket size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Kelola Tiket</div>
                <div className="text-muted text-sm">Generate & export tiket</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
