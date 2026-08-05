'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ticket, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Password tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="auth-brand">Kocok<span>!</span></div>
          <p className="auth-tagline" style={{ marginTop: 12 }}>
            Daftar gratis dan mulai kelola undian doorprize event Anda
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h1 className="auth-card-title">Buat Akun Baru</h1>
          <p className="auth-card-sub">Daftar sebagai Event Organizer</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {success ? (
            <div className="alert alert-success">
              Pendaftaran berhasil! Cek email Anda untuk konfirmasi. Mengalihkan ke login...
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="eo@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-input"
                    placeholder="Min. 6 karakter" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password</label>
                <input type="password" className="form-input" placeholder="Ulangi password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Mendaftar...</> : 'Daftar Sekarang'}
              </button>
            </form>
          )}

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
