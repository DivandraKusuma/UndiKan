'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Shuffle, RotateCcw, Users, Trophy, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'

interface Event {
  id: string
  nama: string
  kode_acara: string
}

interface Winner {
  id: string
  urutan: number
  nama_hadiah: string
  drawn_at: string
  ticket_id: string
  tickets: { nomor_tiket: string } | null
}

interface DrawPageClientProps {
  event: Event
}

export default function DrawPageClient({ event }: DrawPageClientProps) {
  const [eligibleTickets, setEligibleTickets] = useState<string[]>([])
  const [eligibleIds, setEligibleIds] = useState<string[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [displayNumber, setDisplayNumber] = useState('--------')
  const [currentWinner, setCurrentWinner] = useState<string | null>(null)
  const [namaHadiah, setNamaHadiah] = useState('Doorprize')
  const [showWinner, setShowWinner] = useState(false)
  const [loading, setLoading] = useState(true)

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Get all tickets
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('id, nomor_tiket')
      .eq('event_id', event.id)

    // Get winners
    const { data: winnerData } = await supabase
      .from('winners')
      .select('id, urutan, nama_hadiah, drawn_at, ticket_id, tickets(nomor_tiket)')
      .eq('event_id', event.id)
      .order('urutan', { ascending: false })

    const winnerList = (winnerData as unknown as Winner[]) ?? []
    setWinners(winnerList)

    // Determine eligible tickets
    const winnerTicketIds = new Set(winnerList.map(w => w.ticket_id))
    const eligible = (allTickets ?? []).filter(t => allowRepeat || !winnerTicketIds.has(t.id))
    setEligibleTickets(eligible.map(t => t.nomor_tiket))
    setEligibleIds(eligible.map(t => t.id))
    setLoading(false)
  }, [event.id, allowRepeat])

  useEffect(() => { fetchData() }, [fetchData])

  // Slot machine rolling animation
  const startRoll = useCallback(() => {
    if (eligibleTickets.length === 0 || isRolling) return

    setIsRolling(true)
    setShowWinner(false)
    setCurrentWinner(null)

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const targetIdx = Math.floor(Math.random() * eligibleTickets.length)
    const targetTicket = eligibleTickets[targetIdx]
    const targetId = eligibleIds[targetIdx]

    let elapsed = 0
    const duration = 3000 // 3 seconds
    const fastInterval = 60
    const slowInterval = 180

    const roll = () => {
      const progress = elapsed / duration
      const interval = progress < 0.6 ? fastInterval : slowInterval

      if (elapsed >= duration) {
        // Stop — show final winner
        clearInterval(rollIntervalRef.current!)
        setDisplayNumber(targetTicket)
        setCurrentWinner(targetTicket)
        setIsRolling(false)
        setShowWinner(true)
        saveWinner(targetId, targetTicket)
        triggerConfetti()
        return
      }

      // Rolling display — show random ticket or scrambled
      const randIdx = Math.floor(Math.random() * eligibleTickets.length)
      setDisplayNumber(eligibleTickets[randIdx])
      elapsed += interval
    }

    rollIntervalRef.current = setInterval(roll, fastInterval)
  }, [eligibleTickets, eligibleIds, isRolling])

  const saveWinner = async (ticketId: string, ticketNum: string) => {
    const nextUrutan = winners.length + 1
    await supabase.from('winners').insert({
      event_id: event.id,
      ticket_id: ticketId,
      nama_hadiah: namaHadiah || 'Doorprize',
      urutan: nextUrutan,
    })
    fetchData()
  }

  const undoLastWinner = async () => {
    if (winners.length === 0) return
    const last = winners[0]
    await supabase.from('winners').delete().eq('id', last.id)
    setCurrentWinner(null)
    setShowWinner(false)
    setDisplayNumber('--------')
    fetchData()
  }

  const triggerConfetti = () => {
    if (typeof window === 'undefined') return
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#299D91', '#FFFFFF', '#F59E0B', '#4DAF6E', '#525256'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.6 },
        })
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.6 },
        })
      }, 400)
    })
  }

  useEffect(() => {
    return () => { if (rollIntervalRef.current) clearInterval(rollIntervalRef.current) }
  }, [])

  const eligibleCount = eligibleTickets.length
  const totalWinners = winners.length

  return (
    <div className="draw-page">
      {/* Back button */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>
        <Link href={`/dashboard/events/${event.id}`} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      {/* Winner count badge */}
      <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', gap: 10 }}>
        <div className="draw-info-chip">
          <Trophy size={14} color="var(--warning)" />
          {totalWinners} pemenang
        </div>
        <div className="draw-info-chip">
          <Users size={14} color="var(--accent)" />
          {eligibleCount} tiket eligible
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 720, padding: '0 24px' }}>
        {/* Title */}
        <div className="draw-title">UNDIAN DOORPRIZE</div>
        <div className="draw-event-name">{event.nama}</div>

        {/* Nama Hadiah input */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Hadiah:</span>
          <input
            value={namaHadiah}
            onChange={e => setNamaHadiah(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              width: 200,
              textAlign: 'center',
            }}
            placeholder="Nama Hadiah"
          />
        </div>

        {/* Slot Machine Display */}
        <div className="draw-slot-machine">
          {showWinner && (
            <div className="draw-winner-label">PEMENANG!</div>
          )}
          <div className={`draw-number-display ${isRolling ? 'rolling' : ''} ${showWinner ? 'winner' : ''}`}>
            {loading ? (
              <div className="loading-spinner" style={{ width: 40, height: 40, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--accent)' }} />
            ) : (
              displayNumber
            )}
          </div>

          {showWinner && currentWinner && (
            <div style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Selamat kepada pemegang tiket nomor <strong style={{ color: 'var(--accent)' }}>{currentWinner}</strong>!
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="draw-controls">
          <button
            onClick={startRoll}
            disabled={isRolling || eligibleCount === 0 || loading}
            className={`draw-btn-main ${isRolling ? 'rolling' : ''}`}
          >
            {isRolling ? 'Mengundi...' : eligibleCount === 0 ? 'Semua tiket sudah menang' : 'Kocok / Undi Sekarang'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {winners.length > 0 && (
              <button
                onClick={() => { if (confirm('Batalkan pemenang terakhir?')) undoLastWinner() }}
                disabled={isRolling}
                className="btn btn-secondary"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <RotateCcw size={15} /> Batalkan Pemenang Terakhir
              </button>
            )}

            <button
              onClick={() => setAllowRepeat(!allowRepeat)}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: allowRepeat ? 'var(--accent)' : 'rgba(255,255,255,0.5)' }}
            >
              {allowRepeat ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {allowRepeat ? 'Repeat: ON' : 'Repeat: OFF'}
            </button>
          </div>
        </div>

        {/* Info row */}
        <div className="draw-info-row" style={{ marginTop: 24 }}>
          <div className="draw-info-chip">
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{eligibleCount}</span> tiket tersisa
          </div>
          <div className="draw-info-chip">
            Kode: <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 4 }}>{event.kode_acara}</span>
          </div>
        </div>

        {/* Winners list */}
        {winners.length > 0 && (
          <div style={{ marginTop: 32, width: '100%', maxWidth: 600 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Daftar Pemenang
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {winners.map((w, i) => (
                <div key={w.id} style={{
                  background: i === 0 ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? 'var(--accent-glow)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                    {w.urutan}
                  </div>
                  <span className="font-mono" style={{ fontWeight: 800, fontSize: 16, color: i === 0 ? 'var(--accent)' : '#FFFFFF', flex: 1 }}>
                    {w.tickets?.nomor_tiket ?? '-'}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 20 }}>
                    {w.nama_hadiah}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(w.drawn_at).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
