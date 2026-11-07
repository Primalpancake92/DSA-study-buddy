import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const baseline = JSON.parse(
    readFileSync(new URL('./fixtures/curriculum-rewrite-baseline.json', import.meta.url), 'utf8')
);
const hash = (value) => createHash('sha256').update(value).digest('hex');

for (const [path, original] of Object.entries(baseline)) {
    test(`${path}: conversational rewrite preserves teaching and progress contracts`, () => {
        const text = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
        const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
        assert.deepEqual(text.match(/^#{1,2} .+$/gm), original.headings);
        for (const [name, pattern] of [
            ['lessonIds', /<!-- lesson-id:([^ ]+) -->/g],
            ['checkpointIds', /<!-- checkpoint:([^ ]+) -->/g]
        ]) {
            assert.deepEqual(
                [...text.matchAll(pattern)].map((match) => match[1]),
                original[name]
            );
        }
        const blocks = [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```\s*$/gm)];
        assert.deepEqual(
            blocks.map((match) => ({ language: match[1], hash: hash(match[2]) })),
            original.blocks,
            'Examples, diagrams and documented outputs must not disappear or change silently'
        );
        for (const expression of original.math) {
            assert.ok(
                prose.includes(`\`${expression}\``),
                `Missing mathematical expression: ${expression}`
            );
        }
        const tables = [...prose.matchAll(/(?:^\|[^\n]*\n){2,}/gm)].map((match) =>
            hash(
                match[0]
                    .split('\n')
                    .map((line) => line.trim().replace(/\s+/g, ' '))
                    .join('\n')
            )
        );
        for (const table of original.tables) {
            assert.ok(tables.includes(table), 'A teaching table was lost or changed');
        }
        const links = [...prose.matchAll(/\[[^\]\n]+\]\(\s*(?:<([^>]+)>|([^\s)]+))/g)]
            .map((match) => match[1] || match[2])
            .sort();
        const archiveCorrections = {
            '../../shared/curriculum.js': '../../../shared/curriculum.js',
            '../../shared/textbook/weeks01to04.js': '../../../shared/textbook/weeks01to04.js',
            'week-02.md': '../week-02.md',
            'week-03.md': '../week-03.md',
            'week-04.md': '../week-04.md'
        };
        const expectedLinks = original.links.map((link) =>
            path.includes('/archive/') ? archiveCorrections[link] || link : link
        );
        for (const link of expectedLinks) {
            const index = links.indexOf(link);
            assert.notEqual(index, -1, `Lost learning resource or cross-reference: ${link}`);
            links.splice(index, 1);
        }
        const words = prose.replace(/<!--[\s\S]*?-->/g, '').trim().split(/\s+/).length;
        assert.ok(words >= original.proseWords, `Prose shortened: ${words} < ${original.proseWords}`);

        for (const section of text.split(/^## /m)) {
            let number = 0;
            for (const block of section.matchAll(/^```(javascript(?:-bug)?)\n[\s\S]*?^```/gm)) {
                number += 1;
                const preceding = section.slice(0, block.index).trimEnd();
                const label = preceding.split('\n').at(-1);
                assert.match(label, new RegExp(`^### Demonstration ${number} — .+`));
                assert.ok(preceding.slice(0, preceding.lastIndexOf('\n')).trim().length > 0);
                const after = section
                    .slice(block.index + block[0].length)
                    .split(/^### Demonstration /m)[0];
                assert.match(
                    after,
                    new RegExp(`Demonstration ${number}\\b`),
                    'Explain each labelled example'
                );
            }
            const sectionProse = section.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
            for (const paragraph of sectionProse.split(/\n\s*\n/)) {
                for (const reference of paragraph.matchAll(/\bDemonstration (\d+)\b/g)) {
                    if (Number(reference[1]) <= number) {
                        continue;
                    }
                    const namedSection = original.headings
                        .filter((heading) => heading.startsWith('## '))
                        .some((heading) => paragraph.includes(heading.slice(3)));
                    assert.ok(
                        namedSection,
                        `Qualify cross-section demonstration references: ${paragraph}`
                    );
                }
            }
        }
    });
}
