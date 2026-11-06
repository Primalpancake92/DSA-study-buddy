import { useEffect, useState } from 'react';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import { SettingsHeading, SettingsFeedback } from './AccountSettingsLayout.jsx';

export function ConnectedAccountsSettings() {
  const { settings, loading, error: loadError, saveSettings } = useAccountSettings();
  const [connections, setConnections] = useState({ leetcode: '', hackerrank: '' });
  const [state, setState] = useState({ busy: false, error: '', message: '' });
  useEffect(() => { setConnections({ leetcode: settings?.connections?.leetcode || '', hackerrank: settings?.connections?.hackerrank || '' }); }, [settings?.connections?.leetcode, settings?.connections?.hackerrank]);
  async function submit(event) {
    event.preventDefault();
    if (loading || loadError || state.busy) return;
    setState({ busy: true, error: '', message: '' });
    try { await saveSettings({ connections: { leetcode: connections.leetcode.trim(), hackerrank: connections.hackerrank.trim() } }); setState({ busy: false, error: '', message: 'Connected account details saved.' }); }
    catch (reason) { setState({ busy: false, error: reason.message || 'Unable to save connected accounts.', message: '' }); }
  }
return <section><SettingsHeading title="Connected accounts">Save your coding platform usernames for easy reference. This does not sign in to those platforms or sync activity.</SettingsHeading><form className="account-settings-form" onSubmit={submit}><fieldset disabled={loading || Boolean(loadError) || state.busy}><legend className="settings-sr-only">Coding platform usernames</legend>{[['leetcode', 'LeetCode'], ['hackerrank', 'HackerRank']].map(([key, label]) => <label className="settings-field" key={key}>{label} username or public profile URL<input autoComplete="off" value={connections[key]} onChange={(event) => setConnections({ ...connections, [key]: event.target.value })} /><small>Leave blank to remove this username.</small></label>)}<button type="submit" className="button primary">{state.busy ? 'Saving…' : 'Save accounts'}</button></fieldset><SettingsFeedback {...state} /></form><div className="settings-section">{Object.entries(settings.connections).filter(([, url]) => url).map(([platform, url]) => <p key={platform}><a className="text-link" href={url} target="_blank" rel="noopener noreferrer">Open {platform === 'leetcode' ? 'LeetCode' : 'HackerRank'} profile ↗</a></p>)}</div></section>;
}
