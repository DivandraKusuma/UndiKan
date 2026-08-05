'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ticket, Eye, EyeOff, Loader2, Search } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email atau password salah.'
        : error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="auth-brand">UndiKan<span>!</span></div>
          <p className="auth-tagline" style={{ marginTop: 12 }}>
            Platform undian untuk Event Organizer
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {['Undian transparan & anti-kecurangan', 'Export laporan CSV & PDF', 'Real-time ticket counter'].map(f => (
              <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="auth-right">
        <div className="auth-card">
          <h1 className="auth-card-title">Selamat datang!</h1>
          <p className="auth-card-sub">Masuk ke akun Event Organizer Anda</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="eo@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Masuk...</>
              ) : 'Masuk'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Daftar sekarang
            </Link>
          </p>

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--card-border)', position: 'relative' }}>
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--card-bg)',
              padding: '0 12px',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}>
              atau
            </span>
          </div>

          <Link
            href="/check"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--card-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent)'
                ; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)'
                ; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
            }}
          >
            <Search size={15} />
            Cek Nomor Tiket (Publik)
          </Link>
        </div>
      </div>
    </div>
  )
}
