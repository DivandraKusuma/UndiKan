import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--content-bg, #F3F3F3)',
      gap: 16
    }}>
      <Loader2 size={36} color="var(--accent, #299D91)" className="animate-spin" />
      <div style={{ color: 'var(--text-secondary, #666666)', fontSize: 14, fontWeight: 500 }}>
        Memuat data...
      </div>
    </div>
  )
}
