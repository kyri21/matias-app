import type { WeekDraft, Employee } from '../types'
import { HOURS } from '../types'
import { addDays, weekId } from '../firebase/planning'

export function exportCSV(monday: Date, draft: WeekDraft, employees: Employee[]) {
  const byId: Record<string, Employee> = {}
  employees.forEach(e => { byId[e.id] = e })
  const rows: string[] = ['date,jour,heure_debut,heure_fin,employes']
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i)
    const iso = day.toISOString().slice(0, 10)
    const hours = draft[i]?.hours ?? {}
    HOURS.forEach(h => {
      const emps = (hours[String(h)] ?? []).map(id => byId[id]?.name ?? id).join('|')
      if (emps) rows.push(`${iso},${i},${h}:00,${h + 1}:00,"${emps}"`)
    })
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `planning_${weekId(monday)}.csv`)
}

export function exportICS(monday: Date, draft: WeekDraft, emp: Employee) {
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    `X-WR-CALNAME:Planning Matias - ${emp.name}`,
    'PRODID:-//Matias//Planning//FR'
  ]
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i)
    const hours = draft[i]?.hours ?? {}
    let startH: number | null = null, endH: number | null = null
    const flush = () => {
      if (startH === null || endH === null) return
      const s = dtFormat(day, startH, 0), e = dtFormat(day, endH, 0)
      const uid = `${emp.id}-${day.toISOString().slice(0, 10)}-${startH}@matias`
      lines.push('BEGIN:VEVENT', `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        `DTSTART:${s}`, `DTEND:${e}`, `SUMMARY:${emp.name} - Service`, 'END:VEVENT')
      startH = null; endH = null
    }
    HOURS.forEach(h => {
      const present = (hours[String(h)] ?? []).includes(emp.id)
      if (present) { if (startH === null) startH = h; endH = h + 1 } else flush()
    })
    flush()
  }
  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' })
  downloadBlob(blob, `${emp.name}_${weekId(monday)}.ics`)
}

function dtFormat(date: Date, h: number, m: number): string {
  const d = new Date(date); d.setHours(h, m, 0, 0)
  return d.toISOString().replace(/[-:]/g, '').slice(0, 15)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
