import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LearningTools } from './LearningTools.jsx';

vi.mock('./SectionNotes.jsx', () => ({
    SectionNotes: ({ sectionId, title, embedded }) => (
        <textarea aria-label={title} data-section={sectionId} data-embedded={embedded} />
    )
}));
vi.mock('./TutorAssistant.jsx', () => ({
    TutorAssistant: ({ section, embedded }) => (
        <div data-tutor-section={section.id} data-embedded={embedded} />
    )
}));

describe('shared learning tools', () => {
    const section = { id: 'traversal', title: 'Array Traversal' };
    it('uses one embedded notes editor and tutor for the same active section', () => {
        const html = renderToStaticMarkup(
            <LearningTools
                lesson={{ id: 2, lessons: [{ id: 'stable-lesson-id', sectionId: 'traversal' }] }}
                section={section}
            />
        );
        expect(html.match(/<textarea/g)).toHaveLength(1);
        expect(html).toContain('data-section="stable-lesson-id"');
        expect(html).toContain('data-tutor-section="traversal"');
        expect(html.match(/data-embedded="true"/g)).toHaveLength(2);
        expect(html).toContain('aria-label="Learning tools"');
        expect(html).toContain('aria-controls="learning-tools-panel"');
        expect(html).toContain('tutor-launcher learning-tools-trigger');
        expect(html).toContain('aria-label="Open notes and AI tutor"');
        expect(html).toContain('aria-expanded="false"');
    });

    it('preserves the existing fallback note key for sections without lesson records', () => {
        const html = renderToStaticMarkup(<LearningTools lesson={{ id: 2 }} section={section} />);
        expect(html).toContain('data-section="w2-section-traversal"');
        expect(html).toContain('aria-label="Array Traversal"');
    });
});
