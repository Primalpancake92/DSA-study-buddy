import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

function Brand() { return <Link to="/" className="brand"><span className="brand-mark">⌁</span> DSA <em>GRIND</em></Link>; }

export function PublicLayout() {
  return <div className="app-shell public-shell"><header className="topbar public-topbar"><Brand /><nav aria-label="Public navigation"><Link to="/curriculum">Curriculum</Link><a href="/#features">Features</a><a href="/#how-it-works">How It Works</a></nav><div className="nav-actions"><Link className="text-link" to="/login">Login</Link><Link className="button primary compact" to="/register">Get Started</Link></div></header><main><Outlet /></main></div>;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/'); };
  return <div className="app-shell"><header className="topbar"><Brand /><nav aria-label="Application navigation"><NavLink to="/app/dashboard">Dashboard</NavLink><NavLink to="/app/roadmap">Roadmap</NavLink><NavLink to="/app/weeks/1">Week 01</NavLink><NavLink to="/app/settings">Settings</NavLink></nav><div className="profile-actions"><span className="profile-name">{user?.firstName}</span><button className="avatar" aria-label="Log out" onClick={handleLogout}>↗</button></div></header><main><Outlet /></main></div>;
}

export function AuthLayout() {
  return <div className="auth-shell"><header className="auth-topbar"><Brand /><Link className="text-link" to="/">Back to home</Link></header><main><Outlet /></main></div>;
}

export function AppShell({ children }) { return <PublicLayout>{children}</PublicLayout>; }
