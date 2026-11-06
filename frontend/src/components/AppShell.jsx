import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { ActivityHistoryModal } from './ActivityHistoryModal.jsx';

function Brand() { return <Link to="/" className="brand"><span className="brand-mark">⌁</span> DSA <em>GRIND</em></Link>; }

export function PublicLayout() {
  return <div className="app-shell public-shell"><header className="topbar public-topbar"><Brand /><nav aria-label="Public navigation"><Link to="/curriculum">Curriculum</Link><a href="/#features">Features</a><a href="/#how-it-works">How It Works</a></nav><div className="nav-actions"><Link className="text-link" to="/login">Login</Link><Link className="button primary compact" to="/register">Get Started</Link></div></header><main><Outlet /></main></div>;
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'DS';
  useEffect(() => { const close = (event) => { if (!menuRef.current?.contains(event.target)) setOpen(false); }; const escape = (event) => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('mousedown', close); document.addEventListener('keydown', escape); return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); }; }, []);
  const logout = async () => { if (loggingOut) return; setLoggingOut(true); try { await onLogout(); navigate('/'); } finally { setLoggingOut(false); } };
  return <><div className="account-menu-wrap" ref={menuRef}><button className="account-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="account-avatar">{initials}</span><span className="profile-name">{user?.firstName}</span><span aria-hidden="true">⌄</span></button>{open && <div className="account-popover" role="menu"><Link role="menuitem" to="/app/settings" onClick={() => setOpen(false)}>⚙ <span>Account Settings</span></Link><button role="menuitem" onClick={() => { setOpen(false); setHistoryOpen(true); }}>◷ <span>Activity History</span></button><button role="menuitem" className="logout-item" disabled={loggingOut} onClick={logout}>↗ <span>{loggingOut ? 'Logging out…' : 'Log Out'}</span></button></div>}</div><ActivityHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} /></>;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  return <div className="app-shell"><header className="topbar"><Brand /><nav className="app-nav" aria-label="Application navigation"><NavLink to="/app/dashboard">Dashboard</NavLink><NavLink to="/app/roadmap">Roadmap</NavLink><NavLink to="/app/modules">Modules</NavLink></nav><AccountMenu user={user} onLogout={logout} /></header><main><Outlet /></main></div>;
}

export function AuthLayout() {
  return <div className="auth-shell"><header className="auth-topbar"><Brand /><Link className="text-link" to="/">Back to home</Link></header><main><Outlet /></main></div>;
}

export function AppShell({ children }) { return <PublicLayout>{children}</PublicLayout>; }
