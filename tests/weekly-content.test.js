import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'node:util';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const titles = [
    'Introduction to Algorithm Complexity',
    'Hash Maps and Sets',
    'Two Pointers',
    'Sliding Window',
    'Stacks and Queues',
    'Binary Search',
    'Linked Lists',
    'Recursion and Backtracking',
    'Binary Trees',
    'BSTs and Heaps',
    'Graph Foundations',
    'Advanced Graphs',
    'Greedy and Intervals',
    'Dynamic Programming I',
    'Dynamic Programming II and Tries',
    'Interview Consolidation',
    'Arrays and Array Operations'
];
const headings = [
    'Learning Objectives',
    'Prerequisite Knowledge',
    'Core Theory',
    'JavaScript Implementations',
    'Worked Examples',
    'Visual Explanations',
    'Complexity Analysis',
    'Common Mistakes',
    'Interview and LeetCode Pattern Recognition',
    'Practice Exercises',
    'Hints and Worked Solutions',
    'Sources and Further Reading',
    'Weekly Summary',
    'Weekly Progress Checklist'
];
const chapterPath = (week) =>
    resolve(root, `docs/weekly_content/week-${String(week).padStart(2, '0')}.md`);

// Parse fences before inspecting prose: headings, links and placeholders in code
// examples must not be mistaken for document structure.
function parse(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const prose = [...lines];
    const fences = [];
    for (let i = 0; i < lines.length; i++) {
        const open = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*([^\s]*)\s*$/);
        if (!open) continue;
        const start = i;
        const code = [];
        prose[i] = '';
        const close = new RegExp(`^ {0,3}${open[1][0]}{${open[1].length},}\\s*$`);
        while (++i < lines.length && !close.test(lines[i])) {
            code.push(lines[i]);
            prose[i] = '';
        }
        assert.ok(i < lines.length, `Unclosed fence at line ${start + 1}`);
        prose[i] = '';
        fences.push({ language: open[2], code: code.join('\n'), start, end: i });
    }
    return { lines, prose: prose.join('\n'), fences };
}

function runExample(code) {
    const output = [];
    const context = vm.createContext(
        {
            structuredClone,
            console: Object.freeze({ log: (...args) => output.push(format(...args)) })
        },
        {
            codeGeneration: { strings: false, wasm: false },
            microtaskMode: 'afterEvaluate'
        }
    );
    // This is bounded execution of repository-owned examples, not a security
    // boundary for hostile programs. Each fence gets completely fresh globals.
    new vm.Script(code).runInContext(context, { timeout: 1000 });
    return output;
}

function anchors(markdown) {
    const ids = new Set();
    const counts = new Map();
    for (const match of parse(markdown).prose.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
        const base = match[1]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const count = counts.get(base) || 0;
        ids.add(count ? `${base}-${count + 1}` : base);
        counts.set(base, count + 1);
    }
    for (const match of markdown.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(match[1]);
    return ids;
}

function checkLink(destination, file) {
    if (/^(?:https?:|mailto:)/i.test(destination)) {
        assert.doesNotThrow(() => new URL(destination));
        return;
    }
    assert.doesNotMatch(destination, /^(?:javascript|data|vbscript):/i, 'Unsafe link scheme');
    const [pathname, fragment] = destination.split('#');
    const path = pathname.split('?')[0];
    const target = path
        ? resolve(
              path.startsWith('/') ? root : dirname(file),
              decodeURIComponent(path).replace(/^\//, '')
          )
        : file;
    assert.ok(existsSync(target), `Broken link ${destination} in ${file}`);
    if (fragment && extname(target) === '.md' && statSync(target).isFile()) {
        assert.ok(
            anchors(readFileSync(target, 'utf8')).has(decodeURIComponent(fragment)),
            `Missing anchor ${destination} in ${file}`
        );
    }
}

for (const [index, title] of titles.entries()) {
    const week = index + 1;
    test(`week ${week}: canonical chapter, introduction and teaching sections`, () => {
        const document = parse(readFileSync(chapterPath(week), 'utf8'));
        assert.equal(document.lines[0], `# Week ${week} - ${title}`);
        assert.deepEqual(
            [...document.prose.matchAll(/^# (.+)$/gm)].map((m) => m[1]),
            [`Week ${week} - ${title}`]
        );
        const introduction = document.prose.slice(
            document.prose.indexOf('\n'),
            document.prose.indexOf('\n## ')
        );
        assert.match(introduction, /\bweek\b/i);
        assert.match(
            introduction,
            /\b(?:learn|learning|build|model|implement|explain|practice)\b/i
        );
        assert.match(introduction, /checklist/i);
        const sections = [...document.prose.matchAll(/^## (.+)$/gm)];
        if (week === 1 || week === 17) {
            assert.ok(
                sections.length >= 19,
                'Foundations require dedicated lessons and revision sections'
            );
            for (const heading of [
                'Visual Explanations',
                'Hints and Worked Solutions',
                'Sources and Further Reading',
                'Weekly Summary',
                'Weekly Progress Checklist'
            ]) {
                assert.ok(
                    sections.some((section) => section[1] === heading),
                    `Missing ${heading}`
                );
            }
        } else {
            assert.deepEqual(
                sections.map((m) => m[1]),
                headings
            );
        }
        for (let i = 0; i < sections.length; i++) {
            const body = document.prose.slice(
                sections[i].index + sections[i][0].length,
                sections[i + 1]?.index
            );
            const firstLine = document.prose.slice(0, sections[i].index).split('\n').length - 1;
            const lastLine = sections[i + 1]
                ? document.prose.slice(0, sections[i + 1].index).split('\n').length - 1
                : document.lines.length;
            const hasDiagramOrCode = document.fences.some(
                (fence) => fence.start > firstLine && fence.end < lastLine && fence.code.trim()
            );
            assert.ok(/[a-zA-Z]{3}/.test(body) || hasDiagramOrCode, `${headings[i]} is empty`);
        }
        const checklist = document.prose
            .slice(sections.at(-1).index)
            .split('\n')
            .filter((line) => /^\s*[-*+] \[[ xX]\]/.test(line));
        assert.ok(checklist.length > 0, 'Missing progress checklist');
        const ids = checklist.map((line) => {
            const match = line.match(
                new RegExp(
                    `^- \\[ \\] .+ <!-- checkpoint:(w${week}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*) -->$`
                )
            );
            assert.ok(match, `Invalid stable checkpoint: ${line}`);
            assert.ok(match[1].length <= 120, 'Checkpoint ID exceeds the renderer/API limit');
            return match[1];
        });
        assert.equal(new Set(ids).size, ids.length, 'Duplicate checkpoint IDs');
        assert.equal(
            [...document.prose.matchAll(/<!--\s*checkpoint:/g)].length,
            ids.length,
            'Checkpoint outside weekly checklist or malformed item'
        );
    });

    test(`week ${week}: standalone JavaScript and exact adjacent output`, () => {
        const { fences, lines } = parse(readFileSync(chapterPath(week), 'utf8'));
        let checked = 0;
        for (const [i, fence] of fences.entries()) {
            assert.notEqual(fence.language, 'js', 'Use javascript for runnable examples');
            if (fence.language !== 'javascript') continue; // javascript-bug is intentionally not executed.
            checked++;
            assert.match(
                fence.code,
                /\bconsole\.log\s*\(/,
                `Example at line ${fence.start + 1} must demonstrate output`
            );
            const next = fences[i + 1];
            assert.equal(
                next?.language,
                'output',
                `Missing output fence after line ${fence.start + 1}`
            );
            assert.equal(
                lines
                    .slice(fence.end + 1, next.start)
                    .join('\n')
                    .trim(),
                '',
                'Output must immediately follow its example'
            );
            const actual = runExample(fence.code);
            assert.ok(actual.length, 'console.log must actually execute');
            assert.equal(
                actual.join('\n'),
                next.code,
                `Output mismatch at line ${fence.start + 1}`
            );
        }
        assert.ok(checked > 0, 'No runnable examples validated');
        for (const [i, fence] of fences.entries())
            if (fence.language === 'output')
                assert.equal(fences[i - 1]?.language, 'javascript', 'Orphan output fence');
    });

    test(`week ${week}: local links and anchors resolve`, () => {
        const file = chapterPath(week);
        const { prose } = parse(readFileSync(file, 'utf8'));
        const references = new Map(
            [...prose.matchAll(/^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map((m) => [
                m[1].toLowerCase(),
                m[2]
            ])
        );
        for (const match of prose.matchAll(
            /\[[^\]\n]+\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^\n]*["'])?\s*\)/g
        ))
            checkLink(match[1] || match[2], file);
        for (const destination of references.values()) checkLink(destination, file);
        for (const match of prose.matchAll(/\[([^\]\n]+)\]\[([^\]\n]*)\]/g))
            assert.ok(
                references.has((match[2] || match[1]).toLowerCase()),
                `Undefined reference ${match[0]}`
            );
    });
}

test('canonical chapters are not duplicated at the repository root', () => {
    for (let week = 1; week <= 17; week++)
        assert.equal(
            existsSync(resolve(root, `weekly_content/week-${String(week).padStart(2, '0')}.md`)),
            false,
            'Remove duplicate root chapter'
        );
});

test('chapters contain no editorial placeholders or copied substantive paragraphs', () => {
    const seen = new Map();
    for (let week = 1; week <= 17; week++) {
        const { prose } = parse(readFileSync(chapterPath(week), 'utf8'));
        assert.doesNotMatch(
            prose,
            /\b(?:TODO|TBD|FIXME|lorem ipsum|coming soon|content goes here)\b|\[(?:insert|add) [^\]]+\]/i,
            `Placeholder in week ${week}`
        );
        for (const paragraph of prose.split(/\n\s*\n/)) {
            if (
                /^\s*(?:#|[-*+]|\d+\.|\||<)/.test(paragraph) ||
                /This week, you will be learning/i.test(paragraph)
            )
                continue;
            const normalized = paragraph.replace(/\s+/g, ' ').trim();
            // Length identifies prose worth comparing, not a claim about teaching quality.
            if (normalized.split(' ').length < 35) continue;
            assert.ok(
                !seen.has(normalized),
                `Repeated substantive paragraph in weeks ${seen.get(normalized)} and ${week}: ${normalized.slice(0, 100)}`
            );
            seen.set(normalized, week);
        }
    }
});

test('example harness preserves Node formatting, isolation, syntax errors and time limits', () => {
    assert.deepEqual(
        runExample('console.log("%s:%d", "count", 2); console.log({ a: 1 }, [2, 3]);'),
        ['count:2', '{ a: 1 } [ 2, 3 ]']
    );
    assert.deepEqual(runExample('globalThis.exampleState = 1; console.log(exampleState);'), ['1']);
    assert.deepEqual(runExample('console.log(typeof exampleState);'), ['undefined']);
    assert.throws(() => runExample('const = ;'), SyntaxError);
    assert.throws(() => runExample('while (true) {}'), /timed out/);
});

test('Markdown parser ignores fenced headings and rejects incomplete fences', () => {
    const document = parse(
        '# Chapter\n\n```javascript-bug\n## Not a section\nthis is intentionally wrong\n```\n\n## Real section\nBody.'
    );
    assert.equal(document.fences[0].language, 'javascript-bug');
    assert.doesNotMatch(document.prose, /Not a section/);
    assert.match(document.prose, /## Real section/);
    assert.throws(() => parse('```javascript\nconsole.log(1);'), /Unclosed fence/);
    assert.deepEqual(
        [...anchors('# Chapter\n## Worked Examples\n## Worked Examples')],
        ['chapter', 'worked-examples', 'worked-examples-2']
    );
});
