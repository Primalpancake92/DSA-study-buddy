import { tutorApi } from './tutorApi.js';

export function createTutorChat(moduleId, sectionId, api = tutorApi) {
    let state = {
        messages: [],
        partial: '',
        loading: false,
        sending: false,
        enabled: false,
        loaded: false,
        error: '',
        limits: null
    };
    const listeners = new Set();
    let active = true;
    let generation = 0;
    let abort;
    const publish = (patch) => {
        if (!active) return;
        state = { ...state, ...patch };
        for (const listener of listeners) listener();
    };
    async function load() {
        if (state.loading || state.sending) return;
        const current = ++generation;
        publish({ loading: true, error: '' });
        try {
            const result = await api.get(moduleId, sectionId);
            if (current === generation) publish({ ...result, loaded: true, partial: '' });
        } catch (error) {
            if (current === generation)
                publish({ error: error.message || 'Unable to load tutoring history.' });
        } finally {
            if (current === generation) publish({ loading: false });
        }
    }
    async function send({
        message,
        code = '',
        includeNotes = false,
        mode = 'tutor',
        requestId = crypto.randomUUID()
    }) {
        if (!state.loaded || !state.enabled || state.sending || !message.trim()) return false;
        const current = ++generation;
        abort = new AbortController();
        publish({ sending: true, error: '', partial: '', pendingQuestion: message });
        let done = false;
        try {
            await api.send(
                moduleId,
                sectionId,
                { message, code, includeNotes, mode, requestId },
                abort.signal,
                (event) => {
                    if (!active || current !== generation) return;
                    if (event.type === 'delta') {
                        if (state.partial.length + event.text.length > 16000)
                            throw new Error('The tutor response exceeded its limit.');
                        publish({ partial: state.partial + event.text });
                    }
                    if (event.type === 'done') {
                        if (!Array.isArray(event.messages))
                            throw new Error('Invalid saved tutor history.');
                        done = true;
                        publish({
                            messages: event.messages,
                            conversation: event.conversation,
                            limits: event.limits || state.limits,
                            partial: '',
                            pendingQuestion: ''
                        });
                    }
                }
            );
            if (!done)
                throw new Error('Response interrupted. Reload history to check what was saved.');
            return true;
        } catch (error) {
            if (current === generation)
                publish({
                    error: abort.signal.aborted
                        ? 'Response stopped. Reload history to check what was saved.'
                        : error.message || 'The tutor is unavailable. Please try again.'
                });
            return false;
        } finally {
            if (current === generation) publish({ sending: false });
        }
    }
    return {
        getSnapshot: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        load,
        send,
        stop: () => abort?.abort(),
        clear: async () => {
            if (state.sending || state.loading) return;
            const current = ++generation;
            publish({ loading: true, error: '' });
            try {
                const result = await api.clear(moduleId, sectionId);
                if (current === generation)
                    publish({ ...result, partial: '', pendingQuestion: '' });
            } catch (error) {
                if (current === generation)
                    publish({ error: error.message || 'Unable to clear this conversation.' });
            } finally {
                if (current === generation) publish({ loading: false });
            }
        },
        dispose: () => {
            active = false;
            generation += 1;
            abort?.abort();
            listeners.clear();
        }
    };
}
