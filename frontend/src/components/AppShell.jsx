import { NavLink } from 'react-router-dom';

export function AppShell({ children }) {
  return <div className="app-shell">
    <header className="topbar"><NavLink to="/" className="brand"><span className="brand-mark">⌁</span> DSA <em>GRIND</em></NavLink><nav><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/roadmap">Roadmap</NavLink><NavLink to="/lesson/1">Week 01</NavLink></nav><button className="avatar" aria-label="Student profile">JD</button></header>
    <main>{children}</main>
  </div>;
}
