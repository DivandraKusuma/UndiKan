'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Ticket, Loader2, ArrowLeft } from 'lucide-react'

interface CheckResult {
  nomor_tiket: string
  event_nama: string
  event_status: string
  is_winner: boolean
  winner_info?: {
    urutan: number
    nama_hadiah: string
    drawn_at: string
  }
}

export default function CheckPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setNotFound(false)

    const supabase = createClient()

    // Find ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, nomor_tiket, event_id, events(nama, status)')
      .ilike('nomor_tiket', query.trim())
      .single()

    if (!ticket) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Check if winner
    const { data: winner } = await supabase
      .from('winners')
      .select('urutan, nama_hadiah, drawn_at')
      .eq('ticket_id', ticket.id)
      .single()

    setResult({
      nomor_tiket: ticket.nomor_tiket,
      event_nama: (ticket.events as unknown as { nama: string } | null)?.nama ?? 'Unknown Event',
      event_status: (ticket.events as unknown as { status: string } | null)?.status ?? 'aktif',
      is_winner: !!winner,
      winner_info: winner ?? undefined,
    })
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #191919, #111111)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Public header — no auth required */}
      <div style={{ position: 'absolute', top: 20, left: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', color: '#FFFFFF',
          textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)'
        }}>
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>
          Kocok<span style={{ color: '#299D91' }}>!</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
            Cek Tiket <span style={{ color: '#299D91' }}>Kocok!</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
            Masukkan nomor tiket Anda untuk cek apakah menang
          </p>
        </div>

        {/* Search Form */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28 }}>
          <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                Nomor Tiket
              </label>
              <input
                className="form-input font-mono"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="Contoh: EVT2026-001"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  letterSpacing: 1,
                  fontSize: 16,
                  textAlign: 'center',
                }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || !query.trim()}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Mengecek...</> : <><Search size={16} /> Cek Tiket</>}
            </button>
          </form>
        </div>

        {/* Results */}
        {notFound && (
          <div style={{ marginTop: 20, background: 'var(--danger-light)', border: '1.5px solid rgba(231,61,28,0.3)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8, color: 'var(--danger)' }}>—</div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>Tiket Tidak Ditemukan</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 }}>
              Nomor tiket <strong style={{ color: 'var(--danger)' }}>{query}</strong> tidak terdaftar dalam sistem.
            </div>
          </div>
        )}

        {result && (
          <div style={{
            marginTop: 20,
            background: result.is_winner ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${result.is_winner ? 'var(--accent-glow)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 14,
            padding: 28,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {result.is_winner ? '' : '○'}
            </div>
            <div className="font-mono" style={{ fontSize: 26, fontWeight: 900, color: result.is_winner ? '#299D91' : '#FFFFFF', letterSpacing: 1, marginBottom: 8 }}>
              {result.nomor_tiket}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
              {result.event_nama}
            </div>

            {result.is_winner ? (
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#299D91', marginBottom: 12 }}>
                  SELAMAT! TIKET INI MENANG!
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                      #{result.winner_info?.urutan}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Urutan Menang</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)' }}>
                      {result.winner_info?.nama_hadiah}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Hadiah</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>
                      {result.winner_info ? new Date(result.winner_info.drawn_at).toLocaleString('id-ID') : '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Waktu Menang</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  Tiket ini belum menang dalam undian.
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                  {result.event_status === 'selesai'
                    ? 'Maaf, event telah berakhir dan tiket ini tidak terpilih.'
                    : 'Tetap semangat! Undian masih berlangsung.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
