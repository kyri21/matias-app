import { NavLink, Route, Routes } from "react-router-dom";
import Reception from "./pages/Reception";
import Fabrication from "./pages/Fabrication";
import Livraisons from "./pages/Livraisons";
import Temperatures from "./pages/Temperatures";
import Controle from "./pages/Controle";

const NAV = [
  { path: '', label: 'Réception', end: true },
  { path: 'fabrication', label: 'Fabrication' },
  { path: 'livraisons', label: 'Livraisons' },
  { path: 'temperatures', label: 'Températures' },
  { path: 'controle', label: 'Contrôle' },
]

export default function CuisineModule() {
  return (
    <div>
      <nav style={{
        display: 'flex', gap: 2, padding: '8px 10px',
        background: '#1c1c1e',
        borderBottom: '1px solid #38383a',
        overflowX: 'auto', flexWrap: 'nowrap',
        scrollbarWidth: 'none',
      }}>
        {NAV.map(n => (
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
        <Route index element={<Reception />} />
        <Route path="fabrication" element={<Fabrication />} />
        <Route path="livraisons" element={<Livraisons />} />
        <Route path="temperatures" element={<Temperatures />} />
        <Route path="controle" element={<Controle />} />
      </Routes>
    </div>
  );
}
