import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { ActivityHistoryModal } from './ActivityHistoryModal.jsx';
import { useAutoHideNavbar } from '../hooks/useAutoHideNavbar.js';
import '../styles/app-navbar.css';

function Brand() {
    const { user, loading } = useAuth();
    const content = (
        <>
            <span className="brand-mark">⌁</span> DSA <em>GRIND</em>
        </>
    );
    return loading ? (
        <span className="brand" aria-busy="true">
            {content}
        </span>
    ) : (
        <Link to={user ? '/app/dashboard' : '/'} className="brand">
            {content}
        </Link>
    );
}

export function PublicLayout() {
    return (
        <div className="app-shell public-shell">
            <header className="topbar public-topbar">
                <Brand />
                <nav aria-label="Public navigation">
                    <Link to="/curriculum">Curriculum</Link>
                    <a href="/#features">Features</a>
                    <a href="/#how-it-works">How It Works</a>
                </nav>
                <div className="nav-actions">
                    <Link className="text-link" to="/login">
                        Login
                    </Link>
                    <Link className="button primary compact" to="/register">
                        Get Started
                    </Link>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

function AccountMenu({ user, onLogout, open, setOpen }) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const initials =
        `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'DS';
    useEffect(() => {
        const close = (event) => {
            if (!menuRef.current?.contains(event.target)) setOpen(false);
        };
        const escape = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', escape);
        };
    }, []);
    const logout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        setLogoutError('');
        try {
            await onLogout();
            setOpen(false);
            setHistoryOpen(false);
            navigate('/', { replace: true });
        } catch (error) {
            setLogoutError(error.message || 'Logout failed. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    };
    return (
        <>
            {logoutError && <p role="alert">{logoutError}</p>}
            <div className="account-menu-wrap" ref={menuRef}>
                <button
                    className="account-trigger"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                >
                    <span className="account-avatar">{initials}</span>
                    <span className="profile-name">{user?.firstName}</span>
                    <span aria-hidden="true">⌄</span>
                </button>
                {open && (
                    <div className="account-popover" role="menu">
                        <Link role="menuitem" to="/app/settings" onClick={() => setOpen(false)}>
                            ⚙ <span>Account Settings</span>
                        </Link>
                        <button
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                setHistoryOpen(true);
                            }}
                        >
                            ◷ <span>Activity History</span>
                        </button>
                        <button
                            role="menuitem"
                            className="logout-item"
                            disabled={loggingOut}
                            onClick={logout}
                        >
                            ↗ <span>{loggingOut ? 'Logging out…' : 'Log Out'}</span>
                        </button>
                    </div>
                )}
            </div>
            {historyOpen && createPortal(
                <div className="navbar-modal-layer">
                    <ActivityHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
                </div>,
                document.body
            )}
        </>
    );
}

export function AppLayout() {
    const { user, logout } = useAuth();
    const navbar = useAutoHideNavbar();
    return (
        <div className="app-shell">
            <button
                ref={navbar.trigger}
                type="button"
                className="navbar-trigger"
                hidden={!navbar.deep}
                aria-controls="app-navbar"
                aria-expanded={navbar.visible}
                onClick={navbar.toggle}
                onFocus={navbar.onTriggerFocus}
                onBlur={navbar.onBlur}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') navbar.close(true);
                }}
            >
                {navbar.visible ? 'Close navigation' : 'Open navigation'}
            </button>
            <div
                className="navbar-activation-zone"
                hidden={!navbar.deep}
                aria-hidden="true"
                onPointerEnter={navbar.pointerEnter}
                onPointerLeave={navbar.pointerLeave}
            />
            <div className="navbar-slot" style={{ height: navbar.height }}>
                <header
                    ref={navbar.header}
                    id="app-navbar"
                    className={`app-navbar${navbar.deep ? ' is-floating' : ''}${navbar.visible ? ' is-visible' : ''}`}
                    inert={navbar.visible ? undefined : ''}
                    aria-hidden={!navbar.visible}
                    onPointerEnter={navbar.pointerEnter}
                    onPointerLeave={navbar.pointerLeave}
                    onPointerDownCapture={navbar.onPointerDown}
                    onFocusCapture={navbar.onFocus}
                    onBlurCapture={navbar.onBlur}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            navbar.close(true);
                        }
                    }}
                    onClick={(event) => {
                        if (event.target.closest('a[href]')) navbar.close();
                    }}
                >
                    <div className="app-navbar-inner">
                        <Brand />
                        <nav className="app-nav" aria-label="Application navigation">
                            <NavLink to="/app/dashboard">Dashboard</NavLink>
                            <NavLink to="/app/roadmap">Roadmap</NavLink>
                            <NavLink to="/app/modules">Modules</NavLink>
                            <NavLink to="/notes">My Notes</NavLink>
                        </nav>
                        <AccountMenu user={user} onLogout={logout}
                            open={navbar.menuOpen} setOpen={navbar.setMenuOpen} />
                    </div>
                </header>
            </div>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export function AuthLayout() {
    return (
        <div className="auth-shell">
            <header className="auth-topbar">
                <Brand />
                <Link className="text-link" to="/">
                    Back to home
                </Link>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export function AppShell({ children }) {
    return <PublicLayout>{children}</PublicLayout>;
}
