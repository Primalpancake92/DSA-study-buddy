import { useEffect, useState } from 'react';
import { getActivity } from '../services/activityApi.js';

export function ActivityHistoryModal({ open, onClose }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return undefined;

        let active = true;
        setLoading(true);
        setError('');

        async function loadActivity() {
            try {
                const activity = await getActivity();
                if (active) setItems(activity);
            } catch (reason) {
                if (active) setError(reason.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadActivity();
        return () => {
            active = false;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                className="history-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="activity-title"
            >
                <div className="modal-heading">
                    <div>
                        <div className="section-kicker">YOUR ACTIVITY</div>
                        <h2 id="activity-title">Activity history</h2>
                    </div>
                    <button
                        className="modal-close"
                        aria-label="Close activity history"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                {loading && <div className="auth-loading">Loading activity…</div>}
                {error && <div className="form-error">{error}</div>}
                {!loading && !error && !items.length && (
                    <div className="empty-state">
                        <strong>Your history starts here.</strong>
                        <p>
                            Completed lessons, profile changes and future learning events will
                            appear here.
                        </p>
                    </div>
                )}
                <div className="activity-list">
                    {items.map((item) => (
                        <article className="activity-item" key={item.id}>
                            <span className="activity-dot" />
                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.detail || item.activityType}</p>
                                <time dateTime={item.occurredAt}>
                                    {new Date(item.occurredAt).toLocaleString()}
                                </time>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
