import { Link, NavLink, Outlet } from 'react-router-dom';
import {
    User,
    Shield,
    Link2,
    BookOpen,
    Bell,
    Accessibility,
    Palette,
    Database
} from 'lucide-react';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import '../../styles/settings.css';

const groups = [
    [
        'Account',
        [
            ['profile', 'Profile'],
            ['security', 'Security'],
            ['connections', 'Connected accounts']
        ]
    ],
    [
        'Learning',
        [
            ['learning', 'Learning preferences'],
            ['notifications', 'Notifications'],
            ['accessibility', 'Accessibility']
        ]
    ],
    [
        'Application',
        [
            ['appearance', 'Appearance'],
            ['privacy', 'Data & privacy']
        ]
    ]
];
const icons = {
    profile: User,
    security: Shield,
    connections: Link2,
    learning: BookOpen,
    notifications: Bell,
    accessibility: Accessibility,
    appearance: Palette,
    privacy: Database
};
function SettingsIcon({ name }) {
    const Icon = icons[name];
    return <Icon size={20} strokeWidth={1.6} aria-hidden="true" focusable="false" />;
}

export function SettingsHeading({ title, children }) {
    return (
        <header className="account-settings-heading">
            <h2>{title}</h2>
            <p>{children}</p>
        </header>
    );
}

export function SettingsFeedback({ error, message }) {
    return (
        <>
            {error && (
                <p className="settings-error" role="alert">
                    {error}
                </p>
            )}
            {message && (
                <p className="settings-success" role="status">
                    {message}
                </p>
            )}
        </>
    );
}

export function AccountSettingsLayout() {
    const { loading, error, reloadSettings } = useAccountSettings();
    return (
        <div className="page account-settings-page">
            <header className="account-settings-intro">
                <div className="eyebrow">YOUR ACCOUNT</div>
                <h1>Settings</h1>
                <p>Make your learning space work for you.</p>
            </header>
            <div className="account-settings-layout">
                <aside className="account-settings-sidebar">
                    <nav className="account-settings-nav" aria-label="Settings navigation">
                        {groups.map(([group, links]) => (
                            <div className="settings-nav-group" key={group}>
                                <h2>{group}</h2>
                                <div>
                                    {links.map(([path, label]) => (
                                        <NavLink
                                            key={path}
                                            to={`/app/settings/${path}`}
                                            className={({ isActive }) =>
                                                `settings-nav-link${isActive ? ' is-active' : ''}`
                                            }
                                        >
                                            <SettingsIcon name={path} />
                                            {label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                    <Link className="back-link settings-dashboard-link" to="/app/dashboard">
                        ← Back to dashboard
                    </Link>
                </aside>
                <div className="account-settings-content" aria-busy={loading}>
                    {loading && <p role="status">Loading settings…</p>}
                    {error && (
                        <div>
                            <p className="settings-error" role="alert">
                                {error.message || String(error)}
                            </p>
                            <button type="button" className="button dark" onClick={reloadSettings}>
                                Retry loading preferences
                            </button>
                        </div>
                    )}
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
