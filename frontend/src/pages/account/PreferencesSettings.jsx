import { useEffect, useState } from 'react';
import { useAccountSettings } from '../../components/AccountSettingsProvider.jsx';
import { SettingsHeading, SettingsFeedback } from './AccountSettingsLayout.jsx';
import { defaultSettings as defaults } from '../../../../shared/settingsDefaults.js';

function PreferenceForm({ section, title, description, children }) {
  const { settings, loading, error: loadError, saveSettings } = useAccountSettings();
  const saved = settings?.[section];
  const [draft, setDraft] = useState(() => ({ ...defaults[section], ...saved }));
  const [state, setState] = useState({ busy: false, error: '', message: '' });
  useEffect(() => { setDraft({ ...defaults[section], ...saved }); }, [section, saved]);
  const set = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setState((current) => ({ ...current, message: '', error: '' })); };
  async function submit(event) {
    event.preventDefault();
    if (loading || loadError || state.busy) return;
    setState({ busy: true, error: '', message: '' });
    try { await saveSettings({ [section]: draft }); setState({ busy: false, error: '', message: 'Preferences saved.' }); }
    catch (reason) { setState({ busy: false, error: reason.message || 'Unable to save preferences.', message: '' }); }
  }
return <section><SettingsHeading title={title}>{description}</SettingsHeading><form className="account-settings-form" onSubmit={submit}><fieldset disabled={loading || Boolean(loadError) || state.busy}><legend className="settings-sr-only">{title}</legend>{children(draft, set)}<div className="settings-save"><button type="submit" className="button primary">{state.busy ? 'Saving…' : 'Save preferences'}</button></div></fieldset><SettingsFeedback {...state} /></form></section>;
}

function Toggle({ label, description, checked, onChange }) {
  return <label className="settings-toggle"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}
function Select({ label, value, options, onChange }) {
  return <label className="settings-field">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

export function LearningPreferencesSettings() {
return <PreferenceForm section="learning" title="Learning preferences" description="Set a sustainable routine and choose how lessons guide you.">{(draft, set) => <><div className="settings-field-grid"><label className="settings-field">Daily study goal (minutes)<input type="number" required min="15" max="240" step="1" value={draft.dailyMinutes} onChange={(event) => set('dailyMinutes', event.target.value === '' ? '' : Number(event.target.value))} /></label><label className="settings-field">Study days per week<input type="number" required min="1" max="7" step="1" value={draft.daysPerWeek} onChange={(event) => set('daysPerWeek', event.target.value === '' ? '' : Number(event.target.value))} /></label></div><Select label="Difficulty" value={draft.difficulty} options={[[ 'adaptive', 'Adaptive' ], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']]} onChange={(value) => set('difficulty', value)} />{[['showHints', 'Show hints', 'Make hints available while you work.'], ['hideSolutions', 'Hide solutions initially', 'Reveal a solution when you choose to see it.'], ['stepByStep', 'Step-by-step guidance', 'Break supported exercises into guided steps.'], ['revisionExercises', 'Revision exercises', 'Include revision in your learning routine.'], ['showEstimates', 'Show time estimates', 'Display estimated lesson durations.']].map(([key, label, description]) => <Toggle key={key} label={label} description={description} checked={draft[key]} onChange={(value) => set(key, value)} />)}</>}</PreferenceForm>;
}
export function NotificationSettings() {
  return <PreferenceForm section="notifications" title="Notifications" description="Choose in-app reminders evaluated when you open the app. These preferences do not send email or run reminders in the background.">{(draft, set) => <>{[['study', 'Study reminders', 'A reminder to work toward your study goal.'], ['reviews', 'Review reminders', 'A reminder when it is time to revisit your learning.'], ['weeklySummary', 'Weekly summary', 'See a summary of your recent progress.'], ['moduleCompletion', 'Module completion', 'See an update when you complete a module.']].map(([key, label, description]) => <Toggle key={key} label={label} description={description} checked={draft[key]} onChange={(value) => set(key, value)} />)}</>}</PreferenceForm>;
}
export function AccessibilitySettings() {
  return <PreferenceForm section="accessibility" title="Accessibility" description="Adjust text, reading space, and motion to suit your needs.">{(draft, set) => <><Select label="Font size" value={draft.fontSize} options={[['small', 'Small'], ['default', 'Default'], ['large', 'Large'], ['extra-large', 'Extra large']]} onChange={(value) => set('fontSize', value)} /><Select label="Reading width" value={draft.readingWidth} options={[['narrow', 'Narrow'], ['comfortable', 'Comfortable'], ['wide', 'Wide']]} onChange={(value) => set('readingWidth', value)} /><Select label="Line spacing" value={draft.lineSpacing} options={[['compact', 'Compact'], ['comfortable', 'Comfortable'], ['relaxed', 'Relaxed']]} onChange={(value) => set('lineSpacing', value)} /><Toggle label="Reduce motion" description="Minimize interface animations and transitions." checked={draft.reducedMotion} onChange={(value) => set('reducedMotion', value)} /><Toggle label="Enhanced contrast" description="Strengthen contrast for text, borders, and controls." checked={draft.enhancedContrast} onChange={(value) => set('enhancedContrast', value)} /></>}</PreferenceForm>;
}
export function AppearanceSettings() {
  return <PreferenceForm section="appearance" title="Appearance" description="Choose the theme for your learning space.">{(draft, set) => <><Select label="Theme" value={draft.theme} options={[['dark', 'Dark'], ['light', 'Light'], ['system', 'Use device setting']]} onChange={(value) => set('theme', value)} /><p className="settings-note">Use device setting follows your operating system’s light or dark appearance.</p></>}</PreferenceForm>;
}
