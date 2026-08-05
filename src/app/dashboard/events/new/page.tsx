'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateEventCode } from '@/lib/utils/ticket-generator'
import { ArrowLeft, RefreshCw, Loader2, CalendarDays } from 'lucide-react'

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    kode_acara: generateEventCode(),
    nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: '',
    status: 'aktif',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('events').insert({
      ...form,
      created_by: user?.id,
    })
    if (error) {
      if (error.code === '23505') setError('Kode acara sudah digunakan. Coba generate ulang.')
      else setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/events')
      router.refresh()
    }
  }

  return (
    <>
      <div className="top-header">
        <Link href="/dashboard/events" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Kembali
        </Link>
        <div style={{ marginLeft: 12 }}>
          <div className="top-header-title">Buat Event Baru</div>
          <div className="top-header-sub">Isi detail event doorprize</div>
        </div>
      </div>

      <div className="page-wrapper" style={{ maxWidth: 640 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Detail Event</div>
              <div className="card-subtitle">Semua field dengan * wajib diisi</div>
            </div>
            <CalendarDays size={20} color="var(--accent)" />
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Kode Acara *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input font-mono" value={form.kode_acara}
                    onChange={e => set('kode_acara', e.target.value.toUpperCase())}
                    required placeholder="EVT2026-XXXX"
                    style={{ letterSpacing: 1 }} />
                  <button type="button" className="btn btn-secondary"
                    onClick={() => set('kode_acara', generateEventCode())}
                    title="Generate ulang kode">
                    <RefreshCw size={15} />
                  </button>
                </div>
                <span className="form-hint">Kode unik untuk event ini. Akan digunakan sebagai prefix tiket default.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Event *</label>
                <input className="form-input" value={form.nama}
                  onChange={e => set('nama', e.target.value)}
                  required placeholder="Contoh: Gala Dinner Perusahaan 2026" />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tanggal Event *</label>
                  <input type="date" className="form-input" value={form.tanggal}
                    onChange={e => set('tanggal', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status}
                    onChange={e => set('status', e.target.value)}>
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span></label>
                <textarea className="form-input" rows={3} value={form.deskripsi}
                  onChange={e => set('deskripsi', e.target.value)}
                  placeholder="Deskripsi singkat tentang event ini..."
                  style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Link href="/dashboard/events" className="btn btn-secondary">Batal</Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : '✓ Buat Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
