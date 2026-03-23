import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useEmployees } from './hooks/useEmployees'
import { usePlanning } from './hooks/usePlanning'
import { LoginPage } from './components/Auth/LoginPage'
import { PlanningGrid } from './components/Grid/PlanningGrid'
import { EmployeeManager } from './components/Employees/EmployeeManager'
import { MonthlyView } from './components/Monthly/MonthlyView'
import { EventModal } from './components/Events/EventModal'
import { ImportModal } from './components/Import/ImportModal'
import { canEdit } from './types'
import type { Employee, AbsenceType } from './types'
import { weekId } from './firebase/planning'
import { prevMonday, nextMonday, weekLabel, prevMonth, nextMonth, monthLabel } from './utils/dateUtils'
import { mondayOf, duplicateWeek } from './firebase/planning'
import { exportCSV, exportICS } from './utils/exports'
import { signOut } from './firebase/auth'
import { MobilePlanningView } from './components/Mobile/MobilePlanningView'

// ─── Carte employé ─────────────────────────────────────────────────────────
interface EmpCardProps {
  emp: Employee
  worked: number
  selected: boolean
  onSelect: () => void
}

function EmpCard({ emp, worked, selected, onSelect }: EmpCardProps) {
  const pct  = emp.weeklyCapHours > 0 ? worked / emp.weeklyCapHours : 0
  const dot  = pct < 0.9 ? '#22c55e' : pct <= 1 ? '#f97316' : '#ef4444'
  const bgCol = selected ? emp.color + 'dd' : '#1e293b'
  const border = `2px solid ${selected ? emp.color : emp.color + '55'}`

  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1,
        background: bgCol,
        border,
        borderRadius: '10px',
        padding: '8px 6px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.12s',
        boxShadow: selected ? `0 0 18px ${emp.color}55` : 'none',
        minWidth: 0,
      }}
    >
      <div style={{
        width: '30px', height: '30px', borderRadius: '8px',
        background: selected ? 'rgba(255,255,255,0.3)' : emp.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 3px',
        fontSize: '12px', fontWeight: 800, color: '#fff',
      }}>
        {emp.initials}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {emp.name}
      </div>
      <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ fontSize: '10px', color: selected ? '#fff' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          {worked}h / {emp.weeklyCapHours}h
        </span>
      </div>
      <div style={{ marginTop: '3px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, pct * 100)}%`,
          background: dot,
          borderRadius: '2px',
          transition: 'width 0.2s',
        }} />
      </div>
    </div>
  )
}

// ─── Module principal ────────────────────────────────────────────────────────
export default function PlanningModule() {
  const { user, loading: authLoading } = useAuth()
  const { employees, byId } = useEmployees()
  const planning = usePlanning(user)

  const [selectedEmpId, setSelectedEmpId]   = useState<string | null>(null)
  const [showEmpManager, setShowEmpManager] = useState(false)
  const [showExports, setShowExports]       = useState(false)
  const [view, setView]                     = useState<'week' | 'month'>('week')
  const [eventModalDate, setEventModalDate] = useState<string | null>(null)
  const [showImport, setShowImport]         = useState(false)
  const [showHistory, setShowHistory]       = useState(false)
  const [currentMonth, setCurrentMonth]     = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [showDuplicate, setShowDuplicate]   = useState(false)
  const [duplicateTarget, setDuplicateTarget] = useState('')
  const [duplicating, setDuplicating]       = useState(false)
  const [duplicateMsg, setDuplicateMsg]     = useState('')

  useEffect(() => {
    if (user) planning.goToWeek(planning.monday)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (selectedEmpId && !byId[selectedEmpId]) setSelectedEmpId(null)
  }, [byId, selectedEmpId])

  const handleSelectEmp = useCallback((empId: string) => {
    setSelectedEmpId(prev => prev === empId ? null : empId)
  }, [])

  async function handleDuplicate() {
    if (!duplicateTarget || !user) return
    setDuplicating(true)
    setDuplicateMsg('')
    try {
      const dst = mondayOf(new Date(duplicateTarget + 'T12:00:00'))
      await duplicateWeek(planning.monday, dst, user.uid)
      setDuplicateMsg('Semaine copiée !')
      setTimeout(() => { setShowDuplicate(false); setDuplicateMsg('') }, 1500)
    } catch {
      setDuplicateMsg('Erreur lors de la copie.')
    } finally {
      setDuplicating(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#475569', fontSize: '14px' }}>Chargement…</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  const isEditor = canEdit(user.role)

  return (
    <div style={{
      background: '#0f172a',
      color: '#fff',
      height: 'calc(100dvh - var(--safe-top))',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px',
      boxSizing: 'border-box',
      gap: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── En-tête ────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', rowGap: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
          📊 Planning
        </span>

        <div style={{ display: 'flex', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
          <button
            onClick={() => setView('week')}
            style={{ ...btnStyle, border: 'none', borderRadius: 0, background: view === 'week' ? '#2563eb' : 'transparent', color: view === 'week' ? '#fff' : '#94a3b8' }}
          >
            Semaine
          </button>
          <button
            onClick={() => setView('month')}
            style={{ ...btnStyle, border: 'none', borderRadius: 0, background: view === 'month' ? '#2563eb' : 'transparent', color: view === 'month' ? '#fff' : '#94a3b8' }}
          >
            Mois
          </button>
        </div>

        {view === 'week' && (
          <>
            <button onClick={() => planning.goToWeek(prevMonday(planning.monday))} style={btnStyle}>◀</button>
            <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {weekLabel(planning.monday)}
            </span>
            <button onClick={() => planning.goToWeek(nextMonday(planning.monday))} style={btnStyle}>▶</button>
            <input type="date" style={{ ...btnStyle, padding: '3px 6px', cursor: 'text' }}
              onChange={e => e.target.value && planning.goToWeek(mondayOf(new Date(e.target.value + 'T12:00:00')))} />
          </>
        )}

        {view === 'month' && (
          <>
            <button onClick={() => setCurrentMonth(prevMonth(currentMonth))} style={btnStyle}>◀</button>
            <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {monthLabel(currentMonth)}
            </span>
            <button onClick={() => setCurrentMonth(nextMonth(currentMonth))} style={btnStyle}>▶</button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {view === 'week' && selectedEmpId && (
          <span style={{ fontSize: '11px', color: '#fbbf24', whiteSpace: 'nowrap' }}>
            ✏️ {byId[selectedEmpId]?.name}
          </span>
        )}

        {isEditor && view === 'week' && (
          <button
            onClick={planning.save}
            disabled={planning.saving || !planning.dirty}
            style={{
              background: planning.dirty ? '#2563eb' : '#1e293b',
              border: `1px solid ${planning.dirty ? '#3b82f6' : '#334155'}`,
              color: '#fff', borderRadius: '8px', padding: '5px 12px',
              cursor: planning.dirty ? 'pointer' : 'not-allowed',
              fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
              boxShadow: planning.dirty ? '0 0 12px #3b82f655' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {planning.saving ? '⏳ Sauvegarde…' : planning.dirty ? '💾 Sauvegarder ●' : '✅ Sauvegardé'}
          </button>
        )}

        {isEditor && view === 'week' && (
          <>
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowDuplicate(v => !v); setDuplicateMsg('') }} style={btnStyle} title="Dupliquer la semaine">
                ⧉
              </button>
              {showDuplicate && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 100,
                  background: '#1e293b', border: '1px solid #334155',
                  borderRadius: '10px', padding: '10px', minWidth: '220px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    Copier vers la semaine du…
                  </div>
                  <input
                    type="date"
                    value={duplicateTarget}
                    onChange={e => setDuplicateTarget(e.target.value)}
                    style={{ ...btnStyle, width: '100%', padding: '4px 6px', cursor: 'text', boxSizing: 'border-box', marginBottom: '6px' }}
                  />
                  {duplicateMsg && (
                    <div style={{ fontSize: '11px', color: duplicateMsg.startsWith('Erreur') ? '#ef4444' : '#22c55e', marginBottom: '4px' }}>
                      {duplicateMsg}
                    </div>
                  )}
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating || !duplicateTarget}
                    style={{
                      width: '100%', background: '#2563eb', border: '1px solid #3b82f6',
                      color: '#fff', borderRadius: '6px', padding: '5px', fontSize: '11px',
                      cursor: duplicating || !duplicateTarget ? 'not-allowed' : 'pointer',
                      opacity: duplicating || !duplicateTarget ? 0.6 : 1,
                    }}
                  >
                    {duplicating ? '⏳ Copie…' : 'Confirmer'}
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setShowEmpManager(true)} style={btnStyle}>👥</button>
            <button
              onClick={async () => {
                if (!confirm(`Supprimer tout le planning de la semaine ?\n${weekLabel(planning.monday)}\n\nCette action est irréversible.`)) return
                await planning.clearCurrentWeek()
              }}
              style={{ ...btnStyle, color: '#ff453a', border: '1px solid rgba(255,69,58,0.35)' }}
              title="Vider la semaine"
            >🗑</button>
          </>
        )}

        {isEditor && planning.history.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowHistory(v => !v)} style={{ ...btnStyle, color: '#fbbf24' }} title="Historique des sauvegardes">↩</button>
            {showHistory && (
              <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '8px', minWidth: '260px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '2px 6px 8px' }}>Historique des sauvegardes</div>
                {planning.history.map((entry, i) => (
                  <button key={entry.id} onClick={() => { planning.undoTo(entry); setShowHistory(false) }} style={{ display: 'block', width: '100%', background: i === 0 ? 'rgba(251,191,36,0.08)' : 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 600 }}>{entry.label}</div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>Sem. {entry.monday.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isEditor && (
          <button onClick={() => setShowImport(true)} style={btnStyle} title="Importer un planning (CSV/ICS)">📥</button>
        )}
        <button onClick={() => setShowExports(v => !v)} style={btnStyle}>📤</button>
        <button onClick={signOut} style={{ ...btnStyle, color: '#ef4444' }}>⏏</button>
      </div>

      {/* ── Cartes employés (vue semaine, desktop uniquement) ──────── */}
      {view === 'week' && !isMobile && (
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          {employees.map(emp => (
            <EmpCard
              key={emp.id}
              emp={emp}
              worked={planning.weeklyHours(emp.id)}
              selected={selectedEmpId === emp.id}
              onSelect={() => handleSelectEmp(emp.id)}
            />
          ))}
          {employees.length === 0 && (
            <div style={{ color: '#475569', fontSize: '12px', padding: '12px' }}>
              Aucun employé — cliquez 👥 pour en ajouter
            </div>
          )}
        </div>
      )}

      {/* ── Vue principale ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, background: '#1e293b', borderRadius: '12px', padding: isMobile ? '0' : '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {view === 'week' ? (
          isMobile ? (
            <MobilePlanningView
              monday={planning.monday}
              draft={planning.draft}
              employees={employees}
              weekEvents={planning.weekEvents}
              loading={planning.loading}
              onPrevWeek={() => planning.goToWeek(prevMonday(planning.monday))}
              onNextWeek={() => planning.goToWeek(nextMonday(planning.monday))}
            />
          ) : planning.loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px' }}>
              Chargement du planning…
            </div>
          ) : (
            <PlanningGrid
              monday={planning.monday}
              draft={planning.draft}
              byId={byId}
              selectedEmpId={selectedEmpId}
              canEdit={isEditor}
              onPaintCell={planning.paintCell}
              weekEvents={planning.weekEvents}
              onCellContextMenu={dateISO => setEventModalDate(dateISO)}
            />
          )
        ) : (
          <MonthlyView month={currentMonth} employees={employees} />
        )}
      </div>

      {/* ── Panneau exports ─────────────────────────────────────────── */}
      {showExports && (
        <div style={{
          position: 'fixed', bottom: '60px', right: '10px',
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: '12px', padding: '12px', zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: '6px',
          minWidth: '180px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
            Exports
            <button onClick={() => setShowExports(false)} style={{ float: 'right', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
          </div>
          <button onClick={() => exportCSV(planning.monday, planning.draft, employees)} style={exportBtnStyle}>
            🧾 CSV semaine
          </button>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>ICS par employé :</div>
          {employees.map(emp => (
            <button key={emp.id} onClick={() => exportICS(planning.monday, planning.draft, emp)} style={exportBtnStyle}>
              📅 {emp.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Modal employés ──────────────────────────────────────────── */}
      {showEmpManager && (
        <EmployeeManager employees={employees} onClose={() => setShowEmpManager(false)} />
      )}

      {/* ── Modal import CSV/ICS ────────────────────────────────────── */}
      {showImport && user && (
        <ImportModal
          employees={employees}
          currentWeekId={weekId(planning.monday)}
          uid={user.uid}
          onImported={affectedWeekIds => {
            if (affectedWeekIds.includes(weekId(planning.monday))) {
              planning.goToWeek(planning.monday)
            }
            setShowImport(false)
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* ── Modal événement ─────────────────────────────────────────── */}
      {eventModalDate && selectedEmpId && byId[selectedEmpId] && (
        <EventModal
          emp={byId[selectedEmpId]}
          initialDateISO={eventModalDate}
          weekEvents={planning.weekEvents}
          onConfirm={(startISO, endISO, type, minutes) => {
            planning.setEventRange(startISO, endISO, selectedEmpId, type, minutes)
            setEventModalDate(null)
          }}
          onRemove={(startISO, endISO) => {
            planning.removeEventRange(startISO, endISO, selectedEmpId)
            setEventModalDate(null)
          }}
          onClose={() => setEventModalDate(null)}
        />
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#1e293b', border: '1px solid #334155',
  color: '#94a3b8', borderRadius: '6px', padding: '4px 8px',
  cursor: 'pointer', fontSize: '12px',
}
const exportBtnStyle: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155',
  color: '#e2e8f0', borderRadius: '6px', padding: '5px 10px',
  cursor: 'pointer', fontSize: '11px', textAlign: 'left',
}
