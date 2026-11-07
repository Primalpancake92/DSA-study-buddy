import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearAuthCache } from '../services/authApi.js';
import { clearProgress } from '../services/progressStore.js';
import {
    clearSectionNotes,
    flushSectionNotes,
    hasUnsavedSectionNotes,
    retrySectionNotes
} from '../services/sectionNotesStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const warnUnsaved = (event) => {
            if (!hasUnsavedSectionNotes()) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnUnsaved);
        window.addEventListener('online', retrySectionNotes);
        return () => {
            window.removeEventListener('beforeunload', warnUnsaved);
            window.removeEventListener('online', retrySectionNotes);
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadCurrentUser() {
            try {
                const { user: currentUser } = await authApi.me();
                if (active) setUser(currentUser);
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadCurrentUser();
        return () => {
            active = false;
        };
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            register: async (data) => authApi.register(data),
            login: async (data) => {
                const result = await authApi.login(data);
                clearProgress();
                clearSectionNotes();
                setUser(result.user);
                return result.user;
            },
            logout: async () => {
                await flushSectionNotes();
                if (
                    hasUnsavedSectionNotes() &&
                    !window.confirm(
                        'Some section notes are not saved. Log out and discard those drafts?'
                    )
                ) {
                    throw new Error('Logout cancelled. Your unsaved notes are still available.');
                }
                await authApi.logout();
                clearProgress();
                clearSectionNotes();
                setUser(null);
            },
            clearSession: () => {
                clearAuthCache();
                clearProgress();
                clearSectionNotes();
                setUser(null);
            },
            updateUser: (nextUser) => setUser(nextUser)
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error('useAuth must be used inside AuthProvider');
    return value;
}
