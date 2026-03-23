import { useState } from 'react'
import type { Employee, RestrictionRule } from '../../types'
import { HOURS, DAYS_LABELS } from '../../types'
import { createEmployee, updateEmployee, deactivateEmployee } from '../../firebase/employees'

const PRESET_COLORS = [
  '#1976D2','#43A047','#F4511E','#8E24AA','#00897B',
  '#6D4C41','#E53935','#FB8C00','#00ACC1','#7CB342',
  '#F06292','#FF7043','#26A69A','#AB47BC','#5C6BC0'
]

interface Props { employees: Employee[]; onClose: () => void }

export function EmployeeManager({ employees, onClose }: Props) {
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<Employee | null>(null)
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [cap, setCap] = useState(35)
  const [restrictions, setRestrictions] = useState<RestrictionRule[]>([])
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null); setName(''); setInitials(''); setColor(PRESET_COLORS[0]); setCap(35); setRestrictions([]); setMode('edit')
  }

  function openEdit(emp: Employee) {
    setEditing(emp); setName(emp.name); setInitials(emp.initials); setColor(emp.color); setCap(emp.weeklyCapHours)
    const r = emp.restrictions
    if (!r) setRestrictions([])
    else if (Array.isArray(r)) setRestrictions(r)
    else setRestrictions([r as RestrictionRule])
    setMode('edit')
  }

  function addRule() { setRestrictions(prev => [...prev, { days: [], hours: [] }]) }
  function removeRule(idx: number) { setRestrictions(prev => prev.filter((_, i) => i !== idx)) }

  function toggleRuleDay(ruleIdx: number, day: number) {
    setRestrictions(prev => prev.map((r, i) => i !== ruleIdx ? r : {
      ...r, days: r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day],
    }))
  }

  function toggleRuleHour(ruleIdx: number, h: string) {
    setRestrictions(prev => prev.map((r, i) => i !== ruleIdx ? r : {
      ...r, hours: r.hours.includes(h) ? r.hours.filter(x => x !== h) : [...r.hours, h],
    }))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const inits = initials.trim() || name.slice(0, 2).toUpperCase()
    const data: Omit<Employee, 'id'> = {
      name: name.trim(), initials: inits, color, weeklyCapHours: cap, active: true,
      restrictions: restrictions.filter(r => r.days.length > 0 && r.hours.length > 0),
    }
    try {
      editing ? await updateEmployee(editing.id, data) : await createEmployee(data)
      setMode('list')
    } finally { setSaving(false) }
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Désactiver ${emp.name} ?`)) return
    await deactivateEmployee(emp.id)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">
            {mode === 'list' ? '👥 Employés' : (editing ? `Modifier ${editing.name}` : 'Nouvel employé')}
          </h2>
          <button onClick={mode === 'edit' ? () => setMode('list') : onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            {mode === 'edit' ? '←' : '✕'}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {mode === 'list' && (
            <>
              <button onClick={openNew} className="w-full mb-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-semibold">+ Ajouter un employé</button>
              <div className="space-y-2">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 bg-slate-700 rounded-lg px-3 py-2.5">
                    <span style={{ background: emp.color, width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.initials}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{emp.name}</div>
                      <div className="text-slate-400 text-xs">{emp.weeklyCapHours}h/semaine
                        {(emp.restrictions?.length ?? 0) > 0 && <span className="ml-2 text-orange-400">{emp.restrictions!.length} règle{emp.restrictions!.length > 1 ? 's' : ''} d'indispo</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(emp)} className="text-xs bg-slate-600 hover:bg-slate-500 text-white rounded px-2 py-1">✏️</button>
                      <button onClick={() => handleDelete(emp)} className="text-xs bg-red-800 hover:bg-red-700 text-white rounded px-2 py-1">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {mode === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm block mb-1">Nom complet *</label>
                <input value={name} onChange={e => { setName(e.target.value); if (!editing) setInitials(e.target.value.slice(0, 2).toUpperCase()) }}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: Matthieu" />
              </div>
              <div>
                <label className="text-slate-300 text-sm block mb-1">Initiales (1-2 caractères)</label>
                <input value={initials} onChange={e => setInitials(e.target.value.toUpperCase().slice(0, 2))} maxLength={2}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="ex: MT" />
              </div>
              <div>
                <label className="text-slate-300 text-sm block mb-1">Couleur</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{ background: c, width: 28, height: 28, borderRadius: 6, border: color === c ? '2px solid white' : '2px solid transparent' }} />
                  ))}
                </div>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-slate-700" />
              </div>
              <div>
                <label className="text-slate-300 text-sm block mb-1">Heures contrat / semaine</label>
                <input type="number" value={cap} onChange={e => setCap(Number(e.target.value))} min={1} max={45}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-sm font-semibold">Indisponibilités</label>
                  <button type="button" onClick={addRule} className="text-xs bg-blue-700 hover:bg-blue-600 text-white rounded px-2 py-1">+ Ajouter une règle</button>
                </div>
                {restrictions.length === 0 && <div className="text-slate-500 text-xs italic py-1">Aucune règle — cliquez "+ Ajouter une règle" pour définir des créneaux indisponibles.</div>}
                {restrictions.map((rule, ri) => (
                  <div key={ri} className="bg-slate-700 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-xs font-semibold">Règle {ri + 1}</span>
                      <button type="button" onClick={() => removeRule(ri)} className="text-red-400 hover:text-red-300 text-xs">✕ Supprimer</button>
                    </div>
                    <div className="mb-2">
                      <div className="text-slate-400 text-xs mb-1">Jours concernés</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS_LABELS.map((day, di) => (
                          <button key={di} type="button" onClick={() => toggleRuleDay(ri, di)}
                            className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${rule.days.includes(di) ? 'bg-red-700 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Heures bloquées</div>
                      <div className="flex gap-1 flex-wrap">
                        {HOURS.map(h => (
                          <button key={h} type="button" onClick={() => toggleRuleHour(ri, String(h))}
                            className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${rule.hours.includes(String(h)) ? 'bg-red-700 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                    {rule.days.length > 0 && rule.hours.length > 0 && (
                      <div className="mt-2 text-xs text-orange-400">
                        🚫 {rule.days.map(d => DAYS_LABELS[d]).join(', ')} · {(() => { const sorted = [...rule.hours].sort((a, b) => Number(a) - Number(b)); const first = sorted[0], last = sorted[sorted.length - 1]; return first === last ? `${first}h` : `${first}h–${Number(last) + 1}h` })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleSave} disabled={saving || !name.trim()}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm">
                {saving ? 'Enregistrement…' : (editing ? 'Mettre à jour' : "Créer l'employé")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
