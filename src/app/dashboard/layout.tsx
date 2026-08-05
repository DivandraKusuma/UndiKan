import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClientWrapper from '@/components/DashboardClientWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardClientWrapper userEmail={user.email}>
      {children}
    </DashboardClientWrapper>
  )
}
