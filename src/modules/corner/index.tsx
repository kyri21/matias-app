import { Routes, Route, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import Dashboard from './pages/Dashboard'
import Temperatures from './pages/Temperatures'
import Livraison from './pages/Livraison'
import Hygiene from './pages/Hygiene'
import Vitrine from './pages/Vitrine'
import Ruptures from './pages/Ruptures'
import Controle from './pages/Controle'
import Commandes from './pages/Commandes'
import StockageFrigo from './pages/StockageFrigo'
import CA from '../../pages/CA'

const NAV_BASE = [
  { path: '', label: 'Dashboard', end: true },
  { path: 'temperatures', label: 'Températures' },
  { path: 'livraison', label: 'Livraison' },
  { path: 'hygiene', label: 'Hygiène' },
  { path: 'vitrine', label: 'Vitrine' },
  { path: 'frigo', label: 'Frigo' },
  { path: 'ruptures', label: 'Ruptures' },
  { path: 'commandes', label: 'Commandes' },
  { path: 'controle', label: 'Contrôle' },
]

const NAV_MANAGER = [
  ...NAV_BASE,
  { path: 'ca', label: 'CA' },
]

export default function CornerModule() {
  const { user } = useAuth()
  const showCA = ['patron', 'administrateur', 'manager', 'corner'].includes(user?.role ?? '')
  const nav = showCA ? NAV_MANAGER : NAV_BASE

  return (
    <div>
      <nav style={{
        display: 'flex', gap: 2, padding: '8px 10px',
        background: '#1c1c1e',
        borderBottom: '1px solid #38383a',
        overflowX: 'auto', flexWrap: 'nowrap',
        scrollbarWidth: 'none',
      }}>
        {nav.map(n => (
          <NavLink key={n.path} to={n.path} end={n.end}
            style={({ isActive }) => ({
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: isActive ? '#E8760A' : 'rgba(255,255,255,0.06)',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            })}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="temperatures" element={<Temperatures />} />
        <Route path="livraison" element={<Livraison />} />
        <Route path="hygiene" element={<Hygiene />} />
        <Route path="vitrine" element={<Vitrine />} />
        <Route path="ruptures" element={<Ruptures />} />
        <Route path="commandes" element={<Commandes />} />
        <Route path="controle" element={<Controle />} />
        <Route path="frigo" element={<StockageFrigo />} />
        {showCA && <Route path="ca" element={<CA />} />}
      </Routes>
    </div>
  )
}
