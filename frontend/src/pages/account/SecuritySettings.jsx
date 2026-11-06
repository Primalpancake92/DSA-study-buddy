import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider.jsx';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import { apiRequest, authApi } from '../../services/authApi.js';
import { SettingsHeading, SettingsFeedback } from './AccountSettingsLayout.jsx';

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };
const initialState = { busy: false, error: '', message: '' };

export function SecuritySettings() {
  const { user } = useAuth();
  const { loading } = useAccountSettings();
  // Passwords live only in this mounted form and are cleared after a successful change.
  const [password, setPassword] = useState({ ...emptyPassword });
  const [passwordState, setPasswordState] = useState(initialState);
  const [verification, setVerification] = useState(initialState);
  const [sessions, setSessions] = useState([]);
  const [sessionState, setSessionState] = useState({ ...initialState, busy: true });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setSessionState({ ...initialState, busy: true });
    apiRequest('/api/settings/sessions').then((result) => {
      if (!Array.isArray(result.sessions)) throw new Error('Unable to read session information.');
      if (active) { setSessions(result.sessions); setSessionState(initialState); }
    }).catch((reason) => { if (active) setSessionState({ busy: false, error: reason.message || 'Unable to load sessions.', message: '' }); });
    return () => { active = false; };
  }, [reload]);
  async function changePassword(event) {
    event.preventDefault();
    if (passwordState.busy) return;
    if (password.newPassword !== password.confirmPassword) { setPasswordState({ ...initialState, error: 'New passwords must match.' }); return; }
    setPasswordState({ ...initialState, busy: true });
    try { await authApi.changePassword(password); setPassword({ ...emptyPassword }); setPasswordState({ ...initialState, message: 'Password changed.' }); }
    catch (reason) { setPasswordState({ ...initialState, error: reason.message || 'Unable to change your password.' }); }
  }
  async function resend() {
    if (verification.busy) return;
    setVerification({ ...initialState, busy: true });
    try { await authApi.resendVerification(user.email); setVerification({ ...initialState, message: 'If verification is pending, a new verification email has been sent.' }); }
    catch (reason) { setVerification({ ...initialState, error: reason.message || 'Unable to resend verification.' }); }
  }
  async function revokeOthers() {
    if (sessionState.busy) return;
    setSessionState({ ...initialState, busy: true });
    try { await apiRequest('/api/settings/sessions/revoke-others', { method: 'POST' }); setSessions((current) => current.filter((session) => session.current)); setSessionState({ ...initialState, message: 'Other sessions signed out.' }); }
    catch (reason) { setSessionState({ ...initialState, error: reason.message || 'Unable to sign out other sessions.' }); }
  }
  return <section><SettingsHeading title="Security">Manage your password, email verification, and signed-in sessions.</SettingsHeading><div className="settings-section"><h3>Email verification</h3><p className="settings-note">{user?.email}</p><p className={user?.emailVerified ? 'settings-success' : 'settings-note'}>{user?.emailVerified ? 'Email verified' : 'Email verification pending'}</p>{!user?.emailVerified && <button type="button" className="button dark" disabled={verification.busy || loading} onClick={resend}>{verification.busy ? 'Sending…' : 'Resend verification email'}</button>}<SettingsFeedback {...verification} /></div><form className="account-settings-form settings-section" onSubmit={changePassword}><h3>Change password</h3><fieldset disabled={loading || passwordState.busy}><legend className="settings-sr-only">Change password</legend>{[['currentPassword', 'Current password'], ['newPassword', 'New password'], ['confirmPassword', 'Confirm new password']].map(([key, label]) => <label key={key} className="settings-field">{label}<input type="password" required minLength={key === 'currentPassword' ? 1 : 12} maxLength={128} autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} value={password[key]} onChange={(event) => setPassword({ ...password, [key]: event.target.value })} /></label>)}<p className="settings-note">Use at least 12 characters for your new password.</p><button type="submit" className="button primary">{passwordState.busy ? 'Updating…' : 'Change password'}</button></fieldset><SettingsFeedback {...passwordState} /></form><div className="settings-section" aria-busy={sessionState.busy}><h3>Sessions</h3><p className="settings-note">Your current session stays signed in when you sign out other sessions.</p>{sessionState.busy && <p role="status">Updating session information…</p>}<ul className="settings-session-list">{sessions.map((session, index) => <li key={session.id}><strong>{session.current ? 'Current session' : `Other session ${index + 1}`}</strong><span>Expires {session.expiresAt && !Number.isNaN(Date.parse(session.expiresAt)) ? new Date(session.expiresAt).toLocaleString() : 'at an unavailable time'}</span></li>)}</ul>{!sessionState.busy && !sessionState.error && sessions.length === 0 && <p>No active sessions were returned.</p>}<div className="settings-actions"><button type="button" className="button dark" onClick={() => setReload((value) => value + 1)} disabled={sessionState.busy}>Refresh sessions</button><button type="button" className="button dark" onClick={revokeOthers} disabled={sessionState.busy || !sessions.some((session) => !session.current)}>Sign out other sessions</button></div><SettingsFeedback {...sessionState} /></div></section>;
}
