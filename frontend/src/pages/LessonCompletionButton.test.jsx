import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LessonCompletionButton } from './LessonPage.jsx';

const saved = {
    ready: true,
    saving: false,
    reloading: false,
    completedWeeks: [],
    completedCheckpoints: ['lesson']
};

describe('reversible lesson completion', () => {
    it('offers an enabled undo action for completed lessons', () => {
        const html = renderToStaticMarkup(
            <LessonCompletionButton item={{ id: 'lesson' }} weekId={1} progress={saved} />
        );
        expect(html).toContain('Mark incomplete');
        expect(html).toContain('aria-pressed="true"');
        expect(html).not.toContain('disabled');
    });

    it('disables duplicate changes and shows saving feedback during an undo', () => {
        const html = renderToStaticMarkup(
            <LessonCompletionButton
                item={{ id: 'lesson' }}
                weekId={1}
                progress={{ ...saved, saving: true, pendingId: 'lesson' }}
            />
        );
        expect(html).toContain('disabled');
        expect(html).toContain('Saving…');
    });

    it('also offers undo for completed modules with legacy aggregate progress', () => {
        const html = renderToStaticMarkup(
            <LessonCompletionButton
                item={{ id: 'lesson' }}
                weekId={1}
                progress={{ ...saved, completedWeeks: [1], completedCheckpoints: [] }}
            />
        );
        expect(html).toContain('Mark incomplete');
        expect(html).not.toContain('disabled');
    });
});
