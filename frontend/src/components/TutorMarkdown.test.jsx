import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { TutorMarkdown } from './TutorMarkdown.jsx';

it('renders highlighted, copyable code without executable HTML, external images or invented links', () => {
    const html = renderToStaticMarkup(
        <TutorMarkdown
            courseUrl="/app/weeks/1#intro"
            content={
                '<script>alert(1)</script>\n\n![tracking](https://bad.example/pixel)\n\n[unsafe](javascript:alert(1))\n\n[course](/app/weeks/1#intro)\n\n```javascript\nconst count = 1;\n```'
            }
        />
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="/app/weeks/1#intro"');
    expect(html).toContain('Copy code');
    expect(html).toContain('tutor-keyword');
});
