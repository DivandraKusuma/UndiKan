'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Menu } from 'lucide-react'

interface DashboardClientWrapperProps {
  userEmail?: string
  children: React.ReactNode
}

export default function DashboardClientWrapper({ userEmail, children }: DashboardClientWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar with state */}
      <Sidebar userEmail={userEmail} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="mobile-header-logo">
            Kocok<span>!</span>
          </div>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {children}
      </div>
    </div>
  )
}
