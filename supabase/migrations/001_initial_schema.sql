-- =============================================
-- Sistem Undian Doorprize - Initial Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kode_acara TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  tanggal DATE NOT NULL,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nomor_tiket TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, nomor_tiket)
);

-- =============================================
-- WINNERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  nama_hadiah TEXT DEFAULT 'Doorprize',
  urutan INTEGER NOT NULL DEFAULT 1,
  drawn_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- Tickets policies
CREATE POLICY "Users can view tickets of their events" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = tickets.event_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can insert tickets to their events" ON public.tickets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE id = tickets.event_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can delete tickets of their events" ON public.tickets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = tickets.event_id AND created_by = auth.uid())
  );

-- Public read for tickets (for public check page)
CREATE POLICY "Public can read tickets" ON public.tickets
  FOR SELECT USING (true);

-- Winners policies
CREATE POLICY "Users can view winners of their events" ON public.winners
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = winners.event_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can insert winners to their events" ON public.winners
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE id = winners.event_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can delete winners of their events" ON public.winners
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = winners.event_id AND created_by = auth.uid())
  );

-- Public read for winners (for public check page)
CREATE POLICY "Public can read winners" ON public.winners
  FOR SELECT USING (true);

-- Public read events (for draw page and check page)
CREATE POLICY "Public can read events" ON public.events
  FOR SELECT USING (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_winners_event_id ON public.winners(event_id);
CREATE INDEX IF NOT EXISTS idx_winners_ticket_id ON public.winners(ticket_id);
CREATE INDEX IF NOT EXISTS idx_events_kode_acara ON public.events(kode_acara);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
