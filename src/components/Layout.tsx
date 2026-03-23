import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import ModuleGridPanel from './ModuleGridPanel'
import { signOut } from 'firebase/auth'
import { Timestamp, collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuth } from '../auth/useAuth'
import type { Role } from '../types'
import { useInbox } from '../hooks/useInbox'
import type { InboxItem } from '../hooks/useInbox'
import DailyPointageGate, { shouldShowGate, dismissGate } from './DailyPointageGate'
import { useToastState } from '../hooks/useToast'
import Toast from './Toast'

interface NavItem { label: string; path: string; icon: (badge?: number) => React.ReactNode; roles: Role[] }

/* ── Icons ── */
const IconCalendar = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconChef = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
)
const IconShop = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2"/><rect x="5" y="14" width="14" height="7" rx="1"/>
  </svg>
)
const IconChat = ({ badge }: { badge: number }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: -5, right: -6,
        background: '#ff453a', color: '#fff',
        borderRadius: '99px', minWidth: 16, height: 16,
        fontSize: 9, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 3px',
      }}>{badge > 9 ? '9+' : badge}</span>
    )}
  </div>
)
const IconPerson = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconBell = ({ badge }: { badge: number }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: -4, right: -5,
        background: '#ff453a', color: '#fff',
        borderRadius: '99px', minWidth: 16, height: 16,
        fontSize: 9, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 3px',
      }}>{badge > 9 ? '9+' : badge}</span>
    )}
  </div>
)
const IconLogout = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconGrid9 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
    <circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="7" height="12" fill="none" viewBox="0 0 7 12">
    <path d="M1 1l5 5-5 5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ── Nav items — 5 éléments bottom ── */
const NAV_ITEMS: NavItem[] = [
  { label: 'Planning', path: '/planning', icon: () => <IconCalendar />, roles: ['patron', 'administrateur', 'manager', 'corner'] },
  { label: 'Cuisine',  path: '/cuisine',  icon: () => <IconChef />,     roles: ['patron', 'administrateur', 'manager', 'cuisine'] },
  { label: 'Corner',   path: '/corner',   icon: () => <IconShop />,     roles: ['patron', 'administrateur', 'manager', 'corner'] },
  { label: 'Messages', path: '/messages', icon: (b = 0) => <IconChat badge={b} />, roles: ['patron', 'administrateur', 'manager', 'cuisine', 'corner'] },
  { label: 'Profil',   path: '/profile',  icon: () => <IconPerson />,   roles: ['patron', 'administrateur', 'manager', 'cuisine', 'corner'] },
]

const ROLE_LABELS: Record<string, string> = {
  patron: 'Patron', administrateur: 'Admin',
  manager: 'Manager', cuisine: 'Cuisine', corner: 'Corner',
}

/* ── Couleur type inbox ── */
function inboxColor(type: InboxItem['type']): string {
  if (type === 'commande') return '#E8760A'
  if (type === 'temperature') return '#ffd60a'
  return '#2E5C9A'
}
function inboxEmoji(type: InboxItem['type']): string {
  if (type === 'commande') return '📬'
  if (type === 'temperature') return '🌡️'
  return '⏰'
}

function sidebarItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 10px', borderRadius: 8, marginBottom: 2,
    fontSize: 13, fontWeight: 500, textDecoration: 'none',
    cursor: 'pointer', transition: 'background 0.1s ease, color 0.1s ease',
    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
    background: isActive ? 'rgba(232,118,10,0.20)' : 'transparent',
    letterSpacing: '-0.01em',
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [showInbox, setShowInbox] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [moduleGrid, setModuleGrid] = useState<'corner' | 'cuisine' | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { toast, setToast } = useToastState()

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const isOnCorner  = location.pathname.startsWith('/corner')
  const isOnCuisine = location.pathname.startsWith('/cuisine')

  /* ── Inbox ── */
  const { items: inboxItems, count: inboxCount, dismissItem } = useInbox(user)

  /* ── Gate pointage au premier lancement du jour ── */
  useEffect(() => {
    if (!user) return
    if (shouldShowGate(user.role)) setShowGate(true)
  }, [user?.uid, user?.role])

  /* ── Messages non lus ── */
  useEffect(() => {
    if (!user?.uid) return
    let lastRead = Timestamp.fromMillis(0)
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data()?.lastReadMessages) {
        lastRead = snap.data()!.lastReadMessages as Timestamp
      }
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, snap => {
        const count = snap.docs.filter(d => {
          const data = d.data() as any
          return data.senderId !== user.uid
            && data.createdAt?.toMillis
            && data.createdAt.toMillis() > lastRead.toMillis()
        }).length
        setUnread(count)
      })
      return unsub
    })
  }, [user?.uid])

  const visibleItems = NAV_ITEMS.filter(item => user && item.roles.includes(user.role))

  async function handleLogout() {
    dismissGate()
    await signOut(auth)
    navigate('/login')
  }

  const initials = (user?.displayName || user?.email || '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')

  return (
    <>
      {/* ── Gate pointage quotidien ── */}
      {showGate && <DailyPointageGate onDismiss={() => setShowGate(false)} />}

      {/* ── Bandeau hors-ligne ── */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
          background: '#E8760A', color: '#fff',
          fontSize: 13, fontWeight: 600,
          padding: '8px 16px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          Hors-ligne — données synchronisées à la reconnexion
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100dvh', background: '#000' }}>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex" style={{
          width: 220, flexShrink: 0, flexDirection: 'column',
          background: '#1c1c1e', borderRight: '1px solid #38383a',
          position: 'sticky', top: 0, height: '100dvh', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #38383a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
              }}>
                <img src="/icons/icon-192.png" alt="Matias" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Matias</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Espace de travail</div>
              </div>
              {/* Cloche inbox desktop */}
              <button onClick={() => setShowInbox(v => !v)} style={{
                marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: inboxCount > 0 ? '#ff453a' : 'rgba(255,255,255,0.4)',
              }}>
                <IconBell badge={inboxCount} />
              </button>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            {visibleItems.map(item => {
              const isMsg = item.path === '/messages'
              return (
                <NavLink key={item.path} to={item.path}
                  style={({ isActive }) => sidebarItemStyle(isActive)}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    if (el.getAttribute('aria-current') !== 'page') {
                      el.style.background = 'rgba(255,255,255,0.06)'
                      el.style.color = 'rgba(255,255,255,0.8)'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    const active = el.getAttribute('aria-current') === 'page'
                    el.style.background = active ? 'rgba(232,118,10,0.20)' : 'transparent'
                    el.style.color = active ? '#ffffff' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  <span style={{ display: 'flex', flexShrink: 0 }}>
                    {isMsg ? item.icon(unread) : item.icon()}
                  </span>
                  <span>{item.label}</span>
                  {isMsg && unread > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#ff453a', color: '#fff', borderRadius: 99, minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
          {/* Relevés pointage — patron + admin + manager */}
          {user && ['patron', 'administrateur', 'manager'].includes(user.role) && (
            <div style={{ padding: '0 8px 4px', borderTop: '1px solid #38383a', paddingTop: 8 }}>
              <NavLink to="/admin/pointages"
                style={({ isActive }) => sidebarItemStyle(isActive)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  if (el.getAttribute('aria-current') !== 'page') {
                    el.style.background = 'rgba(255,255,255,0.06)'
                    el.style.color = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  const active = el.getAttribute('aria-current') === 'page'
                  el.style.background = active ? 'rgba(232,118,10,0.20)' : 'transparent'
                  el.style.color = active ? '#ffffff' : 'rgba(255,255,255,0.5)'
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}><IconClock /></span>
                <span>Pointages</span>
              </NavLink>
            </div>
          )}

          {/* Fiche allergènes — patron + admin + manager */}
          {user && ['patron', 'administrateur', 'manager'].includes(user.role) && (
            <div style={{ padding: '0 8px 4px' }}>
              <NavLink to="/admin/allergenes"
                style={({ isActive }) => sidebarItemStyle(isActive)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  if (el.getAttribute('aria-current') !== 'page') {
                    el.style.background = 'rgba(255,255,255,0.06)'
                    el.style.color = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  const active = el.getAttribute('aria-current') === 'page'
                  el.style.background = active ? 'rgba(232,118,10,0.20)' : 'transparent'
                  el.style.color = active ? '#ffffff' : 'rgba(255,255,255,0.5)'
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0, fontSize: 16 }}>⚠️</span>
                <span>Allergènes</span>
              </NavLink>
            </div>
          )}

          {/* Paramètres — patron + administrateur uniquement */}
          {user && ['patron', 'administrateur'].includes(user.role) && (
            <div style={{ padding: '0 8px 4px' }}>
              <NavLink to="/admin/settings"
                style={({ isActive }) => sidebarItemStyle(isActive)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  if (el.getAttribute('aria-current') !== 'page') {
                    el.style.background = 'rgba(255,255,255,0.06)'
                    el.style.color = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  const active = el.getAttribute('aria-current') === 'page'
                  el.style.background = active ? 'rgba(232,118,10,0.20)' : 'transparent'
                  el.style.color = active ? '#ffffff' : 'rgba(255,255,255,0.5)'
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}><IconSettings /></span>
                <span>Paramètres</span>
              </NavLink>
            </div>
          )}
          <div style={{ padding: '10px 8px 14px', borderTop: '1px solid #38383a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: '#E8760A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              ...sidebarItemStyle(false), width: '100%', border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: 12,
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,69,58,0.15)'
                ;(e.currentTarget as HTMLElement).style.color = '#ff453a'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'
              }}
            >
              <IconLogout />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100dvh' }}>

          {/* Mobile top bar */}
          <header className="md:hidden" style={{
            background: '#1c1c1e', borderBottom: '1px solid #38383a',
            color: '#fff', padding: '0 16px', height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src="/icons/icon-192.png" alt="Matias" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Matias</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Cloche inbox */}
              <button onClick={() => setShowInbox(v => !v)} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: '#fff',
              }}>
                <IconBell badge={inboxCount} />
              </button>
              <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex' }}>
                <IconLogout />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom))' }}
            className="md:pb-0">
            {children}
          </main>
        </div>

        {/* ── Mobile bottom nav — 5 items ── */}
        {visibleItems.length >= 1 && (
          <nav className="md:hidden bottom-nav" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#1c1c1e', borderTop: '1px solid #38383a',
            display: 'flex', zIndex: 50, height: 'var(--nav-h)',
          }}>
            {visibleItems.map(item => {
              const isMsg    = item.path === '/messages'
              const isCorner = item.path === '/corner'
              const isCuisine= item.path === '/cuisine'
              const isModuleItem = isCorner || isCuisine
              const moduleKey = isCorner ? 'corner' : 'cuisine'
              const isModuleActive = isCorner ? isOnCorner : isCuisine ? isOnCuisine : false

              // Corner et Cuisine : bouton qui ouvre la grille
              if (isModuleItem) {
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (isModuleActive) {
                        setModuleGrid(prev => prev === moduleKey ? null : moduleKey)
                      } else {
                        navigate(item.path)
                        setModuleGrid(null)
                      }
                    }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 3, border: 'none', background: 'none', cursor: 'pointer',
                      color: isModuleActive ? '#E8760A' : 'rgba(255,255,255,0.4)',
                      fontSize: 10, fontWeight: 600,
                      position: 'relative',
                      paddingBottom: 'var(--safe-bottom)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {isModuleActive && (
                      <span style={{
                        position: 'absolute', top: 0, left: '20%', right: '20%',
                        height: 2, borderRadius: '0 0 3px 3px', background: '#E8760A',
                      }} />
                    )}
                    <span style={{ display: 'flex' }}>
                      {isModuleActive ? <IconGrid9 /> : item.icon()}
                    </span>
                    {item.label}
                  </button>
                )
              }

              // Autres items : NavLink normal
              return (
                <NavLink key={item.path} to={item.path}
                  onClick={() => setModuleGrid(null)}
                  style={({ isActive }) => ({
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 3,
                    color: isActive ? '#E8760A' : 'rgba(255,255,255,0.4)',
                    textDecoration: 'none', fontSize: 10, fontWeight: 600,
                    transition: 'color 0.1s ease', position: 'relative',
                    paddingBottom: 'var(--safe-bottom)',
                  })}>
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span style={{
                          position: 'absolute', top: 0, left: '20%', right: '20%',
                          height: 2, borderRadius: '0 0 3px 3px', background: '#E8760A',
                        }} />
                      )}
                      <span style={{ display: 'flex' }}>
                        {isMsg ? item.icon(unread) : item.icon()}
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        )}
      </div>

      <Toast toast={toast} setToast={setToast} />

      {/* ── Module grid panel ── */}
      {moduleGrid && user && (
        <ModuleGridPanel
          module={moduleGrid}
          userRole={user.role}
          onClose={() => setModuleGrid(null)}
        />
      )}

      {/* ── Inbox panel — bottom sheet ── */}
      {showInbox && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowInbox(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#1c1c1e',
            borderRadius: '20px 20px 0 0',
            zIndex: 201,
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            /* Desktop: fixed width à droite */
          }} className="md:top-0 md:bottom-auto md:left-auto md:right-0 md:w-96 md:h-screen md:rounded-none md:border-l md:border-[#38383a]">

            {/* Handle */}
            <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div className="md:hidden" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '12px 20px 12px', borderBottom: '1px solid #38383a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                Notifications
                {inboxCount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{inboxCount}</span>
                )}
              </div>
              <button onClick={() => setShowInbox(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <IconX />
              </button>
            </div>

            {/* Items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {inboxItems.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  Aucune notification pour le moment
                </div>
              ) : (
                inboxItems.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${inboxColor(item.type)}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {inboxEmoji(item.type)}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{item.body}</div>
                      {item.link && (
                        <button onClick={() => { navigate(item.link!); setShowInbox(false) }} style={{
                          marginTop: 8, background: 'none', border: 'none', padding: 0,
                          color: '#E8760A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          Voir <IconChevronRight />
                        </button>
                      )}
                    </div>
                    {/* Dismiss */}
                    <button onClick={() => dismissItem(item.id)} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
                      cursor: 'pointer', padding: 4, flexShrink: 0,
                    }}>
                      <IconX />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
