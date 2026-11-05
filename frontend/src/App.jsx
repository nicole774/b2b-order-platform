import { Routes, Route, Link } from 'react-router'
import { useAuth } from './AuthContext.jsx'
import RequireRole from './RequireRole.jsx'
import Catalogue from './pages/Catalogue.jsx'
import Login from './pages/Login.jsx'
import Cart from './pages/Cart.jsx'
import Orders from './pages/Orders.jsx'
import Admin from './pages/Admin.jsx'

function App() {
  const { user, loading, logout } = useAuth()

  if (loading) return <main><p>Chargement…</p></main>

  return (
    <>
      <header className="header">
        <Link to="/" className="logo">B2B Commandes</Link>
        <nav className="nav">
          <Link to="/">Catalogue</Link>
          {user?.role === 'CLIENT' && (
            <>
              <Link to="/panier">Panier</Link>
              <Link to="/commandes">Mes commandes</Link>
            </>
          )}
          {user?.role === 'ADMIN' && <Link to="/admin">Administration</Link>}
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button type="button" onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <Link to="/connexion">Connexion</Link>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/connexion" element={<Login />} />
          <Route
            path="/panier"
            element={<RequireRole role="CLIENT"><Cart /></RequireRole>}
          />
          <Route
            path="/commandes"
            element={<RequireRole role="CLIENT"><Orders /></RequireRole>}
          />
          <Route
            path="/admin"
            element={<RequireRole role="ADMIN"><Admin /></RequireRole>}
          />
        </Routes>
      </main>
    </>
  )
}

export default App
