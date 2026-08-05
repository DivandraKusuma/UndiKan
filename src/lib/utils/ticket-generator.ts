// Ticket Generator Utility
export interface TicketGeneratorOptions {
  prefix: string
  digits: number
  startNumber: number
  count: number
  eventId: string
}

export interface GeneratedTicket {
  event_id: string
  nomor_tiket: string
}

export function formatTicketNumber(prefix: string, digits: number, num: number): string {
  const padded = String(num).padStart(digits, '0')
  return `${prefix}${padded}`
}

export function generateTickets(options: TicketGeneratorOptions): GeneratedTicket[] {
  const { prefix, digits, startNumber, count, eventId } = options
  const tickets: GeneratedTicket[] = []

  for (let i = 0; i < count; i++) {
    const num = startNumber + i
    const nomor_tiket = formatTicketNumber(prefix, digits, num)
    tickets.push({
      event_id: eventId,
      nomor_tiket,
    })
  }

  return tickets
}

export function getPreview(options: Omit<TicketGeneratorOptions, 'eventId'>): {
  first: string
  last: string
} {
  const { prefix, digits, startNumber, count } = options
  const first = formatTicketNumber(prefix, digits, startNumber)
  const last = formatTicketNumber(prefix, digits, startNumber + count - 1)
  return { first, last }
}

export function generateEventCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `EVT${year}${month}-${random}`
}
