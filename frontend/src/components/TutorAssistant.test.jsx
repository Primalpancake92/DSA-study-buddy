import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TutorLauncher, TutorMessage } from './TutorAssistant.jsx';

describe('compact tutor presentation', () => {
    it('keeps the icon-only launcher accessible in both states', () => {
        const closed = renderToStaticMarkup(<TutorLauncher open={false} onClick={() => {}} />);
        expect(closed).toContain('aria-label="Ask AI tutor"');
        expect(closed).toContain('aria-expanded="false"');
        expect(closed).toContain('aria-controls="learning-tutor-panel"');
        expect(closed).toContain('tutor-launcher-label');
        const open = renderToStaticMarkup(<TutorLauncher open onClick={() => {}} />);
        expect(open).toContain('aria-label="Close AI tutor"');
        expect(open).toContain('aria-expanded="true"');
    });

    it('uses separate assistant rows and user bubbles with screen reader labels', () => {
        const assistant = renderToStaticMarkup(
            <TutorMessage role="assistant">
                <p>A hint</p>
            </TutorMessage>
        );
        const user = renderToStaticMarkup(
            <TutorMessage role="user">
                <p>My answer</p>
            </TutorMessage>
        );
        expect(assistant).toContain('tutor-avatar');
        expect(assistant).toContain('AI tutor');
        expect(user).toContain('tutor-user');
        expect(user).toContain('You');
        expect(user).not.toContain('tutor-avatar');
    });
});
