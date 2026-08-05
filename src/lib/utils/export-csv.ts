import Papa from 'papaparse'

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportTicketsCSV(tickets: Array<{ nomor_tiket: string; created_at: string }>, eventName: string): void {
  const data = tickets.map((t, i) => ({
    'No': i + 1,
    'Nomor Tiket': t.nomor_tiket,
    'Tanggal Generate': new Date(t.created_at).toLocaleDateString('id-ID'),
  }))
  exportToCSV(data as Record<string, unknown>[], `tiket-${eventName.replace(/\s+/g, '-')}`)
}

export function exportWinnersCSV(
  winners: Array<{ urutan: number; nomor_tiket: string; nama_hadiah: string; drawn_at: string }>,
  eventName: string
): void {
  const data = winners.map(w => ({
    'Urutan': w.urutan,
    'Nomor Tiket': w.nomor_tiket,
    'Nama Hadiah': w.nama_hadiah,
    'Waktu Menang': new Date(w.drawn_at).toLocaleString('id-ID'),
  }))
  exportToCSV(data as Record<string, unknown>[], `pemenang-${eventName.replace(/\s+/g, '-')}`)
}
