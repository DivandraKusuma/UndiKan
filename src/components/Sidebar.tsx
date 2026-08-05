'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Trophy,
  Shuffle,
  LogOut,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Events', href: '/dashboard/events', icon: CalendarDays },
]


interface SidebarProps {
  userEmail?: string
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : 'E'
  const displayEmail = userEmail ? (userEmail.length > 20 ? userEmail.slice(0, 18) + '…' : userEmail) : 'Event Organizer'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sidebar-logo-text">
            Kocok<span>!</span>
          </div>
          {/* Mobile close button */}
          <button 
            className="mobile-close-btn d-md-none" 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', color: 'var(--sidebar-text)', 
              cursor: 'pointer', display: 'flex', padding: 4 
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-logo-sub">Event Organizer Platform</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu Utama</div>

        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} className={`sidebar-item ${active ? 'active' : ''}`}>
              <Icon size={17} className="sidebar-icon" />
              {item.label}
            </Link>
          )
        })}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Aksi Cepat</div>

        <Link href="/dashboard/events/new" onClick={onClose} className="sidebar-item">
          <CalendarDays size={17} className="sidebar-icon" />
          + Buat Event
        </Link>

      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayEmail}</div>
            <div className="sidebar-user-role">Event Organizer</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-item" style={{ color: 'var(--danger)', marginTop: 4 }}>
          <LogOut size={17} className="sidebar-icon" />
          Logout
        </button>
      </div>
    </aside>
  )
}
