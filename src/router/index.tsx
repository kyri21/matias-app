import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard, { getRoleHome } from '../auth/AuthGuard';
import { useAuth } from '../auth/useAuth';
import LoadingScreen from '../components/LoadingScreen';
import Layout from '../components/Layout';
import Login from '../pages/Login';

// Modules
import PlanningModule    from '../modules/planning';
import CuisineModule     from '../modules/cuisine';
import CornerModule      from '../modules/corner';
import Messagerie        from '../modules/messagerie';
import CommandePublique  from '../pages/CommandePublique'
import CA                from '../pages/CA'
import AdminUsers        from '../pages/AdminUsers'
import Pointage          from '../pages/Pointage'
import Profile           from '../pages/Profile'
import AdminSettings     from '../pages/AdminSettings'
import AdminPointages    from '../pages/AdminPointages'
import AdminProduits     from '../pages/AdminProduits'
import AllergeneMenu    from '../pages/AllergeneMenu'

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHome(user.role)} replace />;
}

// Rôles complets (patron + administrateur = mêmes droits)
const FULL_ACCESS: import('../types').Role[] = ['patron', 'administrateur', 'manager']

export default function AppRouter() {
  return (
    <Routes>
      {/* Public — formulaire commande client (sans auth) */}
      <Route path="/commande" element={<CommandePublique />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Racine → redirection par rôle */}
      <Route path="/" element={<RootRedirect />} />

      {/* Planning — patron + admin + manager + corner (lecture) */}
      <Route
        path="/planning/*"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager', 'corner']}>
            <Layout><PlanningModule /></Layout>
          </AuthGuard>
        }
      />

      {/* Cuisine — patron + admin + manager + cuisine */}
      <Route
        path="/cuisine/*"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager', 'cuisine']}>
            <Layout><CuisineModule /></Layout>
          </AuthGuard>
        }
      />

      {/* Corner — patron + admin + manager + corner */}
      <Route
        path="/corner/*"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager', 'corner']}>
            <Layout><CornerModule /></Layout>
          </AuthGuard>
        }
      />

      {/* CA — patron + admin + manager */}
      <Route
        path="/ca"
        element={
          <AuthGuard allowedRoles={[...FULL_ACCESS]}>
            <Layout><CA /></Layout>
          </AuthGuard>
        }
      />

      {/* Messagerie — tous les rôles */}
      <Route
        path="/messages"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager', 'cuisine', 'corner']}>
            <Layout><Messagerie /></Layout>
          </AuthGuard>
        }
      />

      {/* Pointage — tous sauf manager */}
      <Route
        path="/pointage"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'cuisine', 'corner']}>
            <Layout><Pointage /></Layout>
          </AuthGuard>
        }
      />

      {/* Admin utilisateurs — patron + administrateur */}
      <Route
        path="/admin/users"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur']}>
            <Layout><AdminUsers /></Layout>
          </AuthGuard>
        }
      />

      {/* Relevés de pointage — patron + admin + manager */}
      <Route
        path="/admin/pointages"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager']}>
            <Layout><AdminPointages /></Layout>
          </AuthGuard>
        }
      />

      {/* Admin paramètres — patron + administrateur */}
      <Route
        path="/admin/settings"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur']}>
            <Layout><AdminSettings /></Layout>
          </AuthGuard>
        }
      />

      {/* Admin produits — patron + administrateur */}
      <Route
        path="/admin/produits"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur']}>
            <Layout><AdminProduits /></Layout>
          </AuthGuard>
        }
      />

      {/* Fiche allergènes — patron + admin + manager */}
      <Route
        path="/admin/allergenes"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager']}>
            <Layout><AllergeneMenu /></Layout>
          </AuthGuard>
        }
      />

      {/* Profil — tous les rôles */}
      <Route
        path="/profile"
        element={
          <AuthGuard allowedRoles={['patron', 'administrateur', 'manager', 'cuisine', 'corner']}>
            <Layout><Profile /></Layout>
          </AuthGuard>
        }
      />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-brand-navy mb-2">Page introuvable</h1>
            <a href="/" className="text-brand-blue underline">Retour à l'accueil</a>
          </div>
        </div>
      } />
    </Routes>
  );
}
