import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthProvider.jsx';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import { apiRequest } from '../../services/authApi.js';
import { SettingsHeading, SettingsFeedback } from './AccountSettingsLayout.jsx';

export function DataPrivacySettings() {
    const { clearSession } = useAuth();
    const { loading } = useAccountSettings();
    const navigate = useNavigate();
    const downloadUrls = useRef(new Set());
    const [exportState, setExportState] = useState({ busy: false, error: '', message: '' });
    const [deleteState, setDeleteState] = useState({ busy: false, error: '', message: '' });
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    useEffect(
        () => () => {
            downloadUrls.current.forEach((url) => URL.revokeObjectURL(url));
            downloadUrls.current.clear();
        },
        []
    );
    async function exportData(format) {
        if (exportState.busy || deleteState.busy) return;
        setExportState({ busy: true, error: '', message: '' });
        try {
            const result = await apiRequest(`/api/settings/export?format=${format}`);
            if (format === 'csv' && typeof result.csv !== 'string')
                throw new Error('The server did not return a CSV export.');
            const blob = new Blob(
                [format === 'csv' ? result.csv : JSON.stringify(result, null, 2)],
                {
                    type:
                        format === 'csv'
                            ? 'text/csv;charset=utf-8'
                            : 'application/json;charset=utf-8'
                }
            );
            const url = URL.createObjectURL(blob);
            downloadUrls.current.add(url);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `dsa-grind-export-${new Date().toISOString().slice(0, 10)}.${format}`;
            document.body.appendChild(anchor);
            try {
                anchor.click();
            } finally {
                anchor.remove();
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    downloadUrls.current.delete(url);
                }, 1000);
            }
            setExportState({
                busy: false,
                error: '',
                message: `${format.toUpperCase()} export download started.`
            });
        } catch (reason) {
            setExportState({
                busy: false,
                error: reason.message || 'Unable to export your data.',
                message: ''
            });
        }
    }
    async function deleteAccount(event) {
        event.preventDefault();
        if (deleteState.busy || exportState.busy || loading) return;
        if (!acknowledged || confirmation !== 'DELETE MY ACCOUNT' || !password) {
            setDeleteState({
                busy: false,
                error: 'Confirm deletion, enter DELETE MY ACCOUNT exactly, and provide your password.',
                message: ''
            });
            return;
        }
        if (typeof clearSession !== 'function') {
            setDeleteState({
                busy: false,
                error: 'Account deletion is currently unavailable. Please reload and try again.',
                message: ''
            });
            return;
        }
        setDeleteState({ busy: true, error: '', message: '' });
        try {
            const result = await apiRequest('/api/settings/account', {
                method: 'DELETE',
                body: JSON.stringify({ password, confirmation })
            });
            if (!result.ok) throw new Error('The server did not confirm account deletion.');
            setPassword('');
            await clearSession();
            navigate('/', { replace: true });
        } catch (reason) {
            setDeleteState({
                busy: false,
                error: reason.message || 'Unable to delete your account.',
                message: ''
            });
        }
    }
    return (
        <section>
            <SettingsHeading title="Data & privacy">
                Download your information or permanently delete your account.
            </SettingsHeading>
            <div className="settings-section">
                <h3>Export your data</h3>
                <p>
                    Download the account and learning data available in your export. JSON is useful
                    for keeping a structured copy; CSV opens in spreadsheet apps.
                </p>
                <div className="settings-actions">
                    <button
                        className="button dark"
                        type="button"
                        disabled={loading || exportState.busy || deleteState.busy}
                        onClick={() => exportData('json')}
                    >
                        Export JSON
                    </button>
                    <button
                        className="button dark"
                        type="button"
                        disabled={loading || exportState.busy || deleteState.busy}
                        onClick={() => exportData('csv')}
                    >
                        Export CSV
                    </button>
                </div>
                {exportState.busy && <p role="status">Preparing your export…</p>}
                <SettingsFeedback {...exportState} />
            </div>
            <form className="account-settings-form settings-danger-zone" onSubmit={deleteAccount}>
                <h3>Delete account</h3>
                <p id="settings-delete-warning">
                    This permanently deletes your account and its saved data. You cannot undo this
                    action. Download an export first if you want to keep a copy.
                </p>
                <fieldset disabled={loading || deleteState.busy || exportState.busy}>
                    <legend className="settings-sr-only">Confirm permanent account deletion</legend>
                    <label className="settings-checkbox">
                        <input
                            type="checkbox"
                            required
                            checked={acknowledged}
                            onChange={(event) => setAcknowledged(event.target.checked)}
                        />
                        <span>
                            I understand that my account and saved data will be permanently deleted.
                        </span>
                    </label>
                    <label className="settings-field">
                        Type DELETE MY ACCOUNT
                        <input
                            required
                            autoComplete="off"
                            spellCheck={false}
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            aria-describedby="settings-delete-warning"
                        />
                    </label>
                    <label className="settings-field">
                        Current password
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>
                    <button
                        type="submit"
                        className="settings-danger-button"
                        disabled={
                            !acknowledged || confirmation !== 'DELETE MY ACCOUNT' || !password
                        }
                    >
                        {deleteState.busy ? 'Deleting account…' : 'Permanently delete my account'}
                    </button>
                </fieldset>
                <SettingsFeedback {...deleteState} />
            </form>
        </section>
    );
}
