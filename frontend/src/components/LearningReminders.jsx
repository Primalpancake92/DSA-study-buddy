import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/authApi.js';
import { useAccountSettings } from './AccountSettingsProvider.jsx';

export function LearningReminders() {
  const { settings } = useAccountSettings();
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true; setError('');
    apiRequest('/api/settings/reminders').then((data) => { if (current) setReminders(data.reminders); }).catch((reason) => { if (current) setError(reason.message); });
    return () => { current = false; };
  }, [settings.notifications, settings.learning]);
  if (error) return <p role="status">Learning reminders are unavailable: {error}</p>;
  if (!reminders.length) return null;
  return <section className="learning-reminders"><h2>Your learning reminders</h2><p>In-app updates, refreshed when you open the dashboard.</p><ul>{reminders.map((item) => <li key={item.id}><Link to={item.href}>{item.text}</Link></li>)}</ul></section>;
}
