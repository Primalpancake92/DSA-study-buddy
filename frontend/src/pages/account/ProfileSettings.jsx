import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider.jsx';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import { authApi } from '../../services/authApi.js';
import { SettingsHeading, SettingsFeedback } from './AccountSettingsLayout.jsx';

export function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const { loading } = useAccountSettings();
  const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', username: user?.username || '' });
  const [state, setState] = useState({ busy: false, error: '', message: '' });
  useEffect(() => { setProfile({ firstName: user?.firstName || '', lastName: user?.lastName || '', username: user?.username || '' }); }, [user?.firstName, user?.lastName, user?.username]);
  async function submit(event) {
    event.preventDefault();
    if (state.busy) return;
    setState({ busy: true, error: '', message: '' });
    try { const result = await authApi.updateProfile(profile); updateUser(result.user); setState({ busy: false, error: '', message: 'Profile saved.' }); }
    catch (reason) { setState({ busy: false, error: reason.message || 'Unable to save your profile.', message: '' }); }
  }
  return <section><SettingsHeading title="Profile">Manage the details attached to your account.</SettingsHeading><form className="account-settings-form" onSubmit={submit}><fieldset disabled={loading || state.busy}><legend className="settings-sr-only">Profile information</legend><div className="settings-field-grid">{[['firstName', 'First name'], ['lastName', 'Last name'], ['username', 'Username']].map(([key, label]) => <label className="settings-field" key={key}>{label}<input required maxLength={key === 'username' ? 32 : 80} minLength={key === 'username' ? 3 : 1} pattern={key === 'username' ? '[a-zA-Z0-9_]+' : undefined} autoComplete={{ firstName: 'given-name', lastName: 'family-name', username: 'username' }[key]} value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} /></label>)}<label className="settings-field">Email address<input type="email" value={user?.email || ''} disabled /><small>Used for sign-in and account verification.</small></label></div>{user?.createdAt && <p className="settings-note">Member since {new Date(user.createdAt).toLocaleDateString()}</p>}<button className="button primary" type="submit">{state.busy ? 'Saving…' : 'Save profile'}</button></fieldset><SettingsFeedback {...state} /></form></section>;
}
