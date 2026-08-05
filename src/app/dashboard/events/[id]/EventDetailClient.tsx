'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateTickets, getPreview, formatTicketNumber } from '@/lib/utils/ticket-generator'
import { exportTicketsCSV, exportWinnersCSV } from '@/lib/utils/export-csv'
import {
  Ticket, Trophy, Plus, Download, Trash2, Search, ChevronLeft, ChevronRight,
  Eye, Loader2, Pencil, Check, X, RefreshCw
} from 'lucide-react'

interface Event {
  id: string
  kode_acara: string
  nama: string
  tanggal: string
  status: string
  deskripsi?: string
}

interface TicketRow {
  id: string
  nomor_tiket: string
  created_at: string
}

interface WinnerRow {
  id: string
  urutan: number
  nama_hadiah: string
  drawn_at: string
  tickets: { nomor_tiket: string } | null
}

const ITEMS_PER_PAGE = 20

export default function EventDetailClient({
  event,
  initialTicketCount,
}: {
  event: Event
  initialTicketCount: number
}) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'winners' | 'settings'>('tickets')

  // Ticket tab state
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [ticketCount, setTicketCount] = useState(initialTicketCount)
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketLoading, setTicketLoading] = useState(false)

  // Generate ticket form
  const [genForm, setGenForm] = useState({
    prefix: event.kode_acara + '-',
    digits: 3,
    startNumber: 1,
    count: 100,
  })
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')
  const [genSuccess, setGenSuccess] = useState('')
  const [showGenForm, setShowGenForm] = useState(false)

  // Winners tab state
  const [winners, setWinners] = useState<WinnerRow[]>([])
  const [winnersLoading, setWinnersLoading] = useState(false)

  // Edit event
  const [editForm, setEditForm] = useState({ nama: event.nama, tanggal: event.tanggal, deskripsi: event.deskripsi ?? '', status: event.status })
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState('')

  const supabase = createClient()

  const fetchTickets = useCallback(async () => {
    setTicketLoading(true)
    let query = supabase
      .from('tickets')
      .select('id, nomor_tiket, created_at')
      .eq('event_id', event.id)
      .order('nomor_tiket', { ascending: true })

    if (ticketSearch) {
      query = query.ilike('nomor_tiket', `%${ticketSearch}%`)
    }

    const from = (ticketPage - 1) * ITEMS_PER_PAGE
    query = query.range(from, from + ITEMS_PER_PAGE - 1)

    const { data } = await query
    setTickets(data ?? [])
    setTicketLoading(false)
  }, [event.id, ticketSearch, ticketPage])

  const fetchTicketCount = useCallback(async () => {
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
    setTicketCount(count ?? 0)
  }, [event.id])

  const fetchWinners = useCallback(async () => {
    setWinnersLoading(true)
    const { data } = await supabase
      .from('winners')
      .select('id, urutan, nama_hadiah, drawn_at, tickets(nomor_tiket)')
      .eq('event_id', event.id)
      .order('urutan', { ascending: true })
    setWinners((data as unknown as WinnerRow[]) ?? [])
    setWinnersLoading(false)
  }, [event.id])

  useEffect(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => { if (activeTab === 'winners') fetchWinners() }, [activeTab, fetchWinners])

  const preview = getPreview({
    prefix: genForm.prefix,
    digits: genForm.digits,
    startNumber: genForm.startNumber,
    count: genForm.count,
  })

  const handleGenerate = async () => {
    setGenError('')
    setGenSuccess('')
    setGenLoading(true)

    // Auto-detect the true last ticket number for this prefix.
    // Order by nomor_tiket DESC (reliable for zero-padded numbers like JMK-001…JMK-100).
    // Using created_at was unreliable because bulk-inserted tickets share the same timestamp.
    let startNum = genForm.startNumber
    if (ticketCount > 0) {
      const { data: lastTickets } = await supabase
        .from('tickets')
        .select('nomor_tiket')
        .eq('event_id', event.id)
        .ilike('nomor_tiket', `${genForm.prefix}%`)  // only match current prefix
        .order('nomor_tiket', { ascending: false })
        .limit(1)

      if (lastTickets && lastTickets.length > 0) {
        const lastNomor = lastTickets[0].nomor_tiket
        // Strip prefix, then parse the numeric suffix
        const suffix = lastNomor.slice(genForm.prefix.length)
        const lastNum = parseInt(suffix, 10)
        if (!isNaN(lastNum)) {
          startNum = lastNum + 1
        }
      }
    }

    const newTickets = generateTickets({
      ...genForm,
      startNumber: startNum,
      eventId: event.id,
    })

    // Batch insert in chunks of 500
    const chunkSize = 500
    for (let i = 0; i < newTickets.length; i += chunkSize) {
      const chunk = newTickets.slice(i, i + chunkSize)
      const { error } = await supabase.from('tickets').insert(chunk)
      if (error) {
        setGenError(
          error.code === '23505'
            ? `Duplikat terdeteksi. Nomor mulai dari ${startNum} sudah ada.`
            : error.message
        )
        setGenLoading(false)
        fetchTicketCount()
        fetchTickets()
        return
      }
    }

    setGenSuccess(`Berhasil generate ${newTickets.length} tiket! (${newTickets[0].nomor_tiket} s/d ${newTickets[newTickets.length - 1].nomor_tiket})`)
    setGenLoading(false)
    setShowGenForm(false)
    fetchTicketCount()
    fetchTickets()
  }

  const handleDeleteWinner = async (winnerId: string) => {
    await supabase.from('winners').delete().eq('id', winnerId)
    fetchWinners()
  }

  const handleExportTickets = async () => {
    const { data } = await supabase.from('tickets').select('nomor_tiket, created_at').eq('event_id', event.id).order('nomor_tiket')
    if (data) exportTicketsCSV(data, event.nama)
  }

  const handleExportWinners = async () => {
    const { data } = await supabase
      .from('winners')
      .select('urutan, nama_hadiah, drawn_at, tickets(nomor_tiket)')
      .eq('event_id', event.id)
      .order('urutan')
    if (data) {
      const flat = (data as unknown as WinnerRow[]).map(w => ({
        urutan: w.urutan,
        nomor_tiket: w.tickets?.nomor_tiket ?? '-',
        nama_hadiah: w.nama_hadiah,
        drawn_at: w.drawn_at,
      }))
      exportWinnersCSV(flat, event.nama)
    }
  }

  const handleSaveEvent = async () => {
    setEditLoading(true)
    setEditMsg('')
    const { error } = await supabase.from('events').update(editForm).eq('id', event.id)
    setEditMsg(error ? 'Gagal: ' + error.message : 'Event berhasil diperbarui!')
    setEditLoading(false)
  }

  const totalPages = Math.ceil(ticketCount / ITEMS_PER_PAGE)

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--card-border)', paddingBottom: 0 }}>
        {([['tickets', 'Tiket', <Ticket size={14} key="t" />], ['winners', 'Pemenang', <Trophy size={14} key="w" />], ['settings', 'Pengaturan', <Pencil size={14} key="s" />]] as const).map(([tab, label, icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'tickets' | 'winners' | 'settings')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13.5,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ===== TICKETS TAB ===== */}
      {activeTab === 'tickets' && (
        <div>
          {/* Generate button & counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{ticketCount.toLocaleString('id-ID')}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 6 }}>tiket terdaftar</span>
            </div>
            <button onClick={handleExportTickets} className="btn btn-secondary btn-sm">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => { setShowGenForm(!showGenForm); setGenError(''); setGenSuccess('') }} className="btn btn-primary btn-sm">
              <Plus size={14} /> Generate Tiket
            </button>
          </div>

          {genSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{genSuccess}</div>}

          {/* Generate Form */}
          {showGenForm && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent-glow)' }}>
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div className="card-title">Generate Tiket Baru</div>
                <button onClick={() => setShowGenForm(false)} className="modal-close"><X size={16} /></button>
              </div>
              <div className="card-body">
                {genError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{genError}</div>}

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Prefix</label>
                    <input className="form-input font-mono" value={genForm.prefix}
                      onChange={e => setGenForm(f => ({ ...f, prefix: e.target.value }))}
                      placeholder="EVT2026-" />
                    <span className="form-hint">Bisa dikosongkan</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Digit Nomor</label>
                    <input type="number" className="form-input" min={1} max={8}
                      value={genForm.digits}
                      onChange={e => setGenForm(f => ({ ...f, digits: parseInt(e.target.value) || 3 }))} />
                    <span className="form-hint">Misal 3 → 001, 5 → 00001</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Awal</label>
                    <input type="number" className="form-input" min={1}
                      value={genForm.startNumber}
                      onChange={e => setGenForm(f => ({ ...f, startNumber: parseInt(e.target.value) || 1 }))} />
                    <span className="form-hint">
                      {ticketCount > 0 ? 'Ada tiket sebelumnya, sistem akan lanjut dari nomor terakhir' : 'Default mulai dari 1'}
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Tiket</label>
                    <input type="number" className="form-input" min={1} max={10000}
                      value={genForm.count}
                      onChange={e => setGenForm(f => ({ ...f, count: parseInt(e.target.value) || 1 }))} />
                  </div>
                </div>

                {/* Preview */}
                <div className="ticket-preview" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="ticket-preview-label">Tiket Pertama</div>
                    <div className="ticket-preview-value">{preview.first}</div>
                  </div>
                  <div className="ticket-preview-sep">···</div>
                  <div>
                    <div className="ticket-preview-label">Tiket Terakhir</div>
                    <div className="ticket-preview-value">{preview.last}</div>
                  </div>
                  <div>
                    <div className="ticket-preview-label">Total</div>
                    <div className="ticket-preview-value" style={{ color: 'rgba(255,255,255,0.8)' }}>{genForm.count}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowGenForm(false)} className="btn btn-secondary">Batal</button>
                  <button onClick={handleGenerate} className="btn btn-primary" disabled={genLoading}>
                    {genLoading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Check size={15} /> Generate {genForm.count} Tiket</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: 12 }}>
            <div className="search-bar">
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Cari nomor tiket..." value={ticketSearch}
                onChange={e => { setTicketSearch(e.target.value); setTicketPage(1) }} />
              {ticketSearch && (
                <button onClick={() => { setTicketSearch(''); setTicketPage(1) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tickets Table */}
          <div className="card">
            {ticketLoading ? (
              <div className="loading-page" style={{ minHeight: 200 }}>
                <div className="loading-spinner" style={{ width: 28, height: 28 }} />
                <span>Memuat tiket...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Ticket size={24} /></div>
                <div className="empty-state-title">{ticketSearch ? 'Tiket tidak ditemukan' : 'Belum ada tiket'}</div>
                <div className="empty-state-desc">{ticketSearch ? 'Coba ubah kata kunci pencarian' : 'Klik "Generate Tiket" untuk membuat tiket peserta'}</div>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nomor Tiket</th>
                        <th>Tanggal Generate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t, i) => (
                        <tr key={t.id}>
                          <td style={{ color: 'var(--text-muted)', width: 50 }}>
                            {(ticketPage - 1) * ITEMS_PER_PAGE + i + 1}
                          </td>
                          <td>
                            <span className="font-mono" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
                              {t.nomor_tiket}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                            {new Date(t.created_at).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setTicketPage(p => Math.max(1, p - 1))} disabled={ticketPage === 1}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {ticketPage} / {totalPages}
                    </span>
                    <button className="page-btn" onClick={() => setTicketPage(p => Math.min(totalPages, p + 1))} disabled={ticketPage === totalPages}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== WINNERS TAB ===== */}
      {activeTab === 'winners' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{winners.length}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 6 }}>pemenang</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchWinners} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
              <button onClick={handleExportWinners} className="btn btn-secondary btn-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="card">
            {winnersLoading ? (
              <div className="loading-page" style={{ minHeight: 200 }}>
                <div className="loading-spinner" style={{ width: 28, height: 28 }} />
                <span>Memuat pemenang...</span>
              </div>
            ) : winners.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Trophy size={24} /></div>
                <div className="empty-state-title">Belum ada pemenang</div>
                <div className="empty-state-desc">Mulai undian dari halaman Draw untuk menentukan pemenang</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Urutan</th>
                      <th>Nomor Tiket</th>
                      <th>Nama Hadiah</th>
                      <th>Waktu Menang</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map(w => (
                      <tr key={w.id}>
                        <td>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                            {w.urutan}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, fontSize: 14 }}>
                            {w.tickets?.nomor_tiket ?? '-'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-teal">{w.nama_hadiah}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                          {new Date(w.drawn_at).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <button onClick={() => { if (confirm('Hapus pemenang ini?')) handleDeleteWinner(w.id) }}
                            className="btn btn-danger btn-sm">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-header">
            <div className="card-title">Edit Event</div>
          </div>
          <div className="card-body">
            {editMsg && <div className={`alert ${editMsg.startsWith('Gagal') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>{editMsg}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nama Event</label>
                <input className="form-input" value={editForm.nama}
                  onChange={e => setEditForm(f => ({ ...f, nama: e.target.value }))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input type="date" className="form-input" value={editForm.tanggal}
                    onChange={e => setEditForm(f => ({ ...f, tanggal: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={3} value={editForm.deskripsi}
                  onChange={e => setEditForm(f => ({ ...f, deskripsi: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSaveEvent} className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : '✓ Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
