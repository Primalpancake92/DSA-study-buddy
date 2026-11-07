import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const source = args[args.indexOf('--source') + 1];
const output = args[args.indexOf('--output') + 1];
if (!source || !output) {
    console.error('Usage: npm run import:curriculum -- --source <repo> --output <dir>');
    process.exit(1);
}
const required = [
    'README.md',
    'STUDY-PLAYBOOK.md',
    'resources/README.md',
    'resources/free-lectures.md',
    'resources/offline-materials.md',
    'guides/pattern-recognition.md',
    'guides/complexity.md',
    'guides/javascript-pitfalls.md',
    'guides/spaced-repetition.md',
    'guides/mock-interviews.md',
    'practice/README.md',
    'templates/solution-journal.md',
    'progress.csv',
    'review-queue.csv',
    ...Array.from({ length: 16 }, (_, i) => `weeks/${String(i + 1).padStart(2, '0')}.md`)
];
const missing = required.filter(
    (file) => !fs.existsSync(path.join(source, file.replace(/\'$/, '')))
);
if (missing.length) {
    console.error(
        `Curriculum import aborted: ${missing.length} required source files are missing.`
    );
    missing.forEach((file) => console.error(` - ${file}`));
    process.exit(2);
}
fs.mkdirSync(output, { recursive: true });
const weeks = Array.from({ length: 16 }, (_, i) => {
    const sourcePath = `weeks/${String(i + 1).padStart(2, '0')}.md`;
    return {
        id: i + 1,
        sourcePath,
        markdown: fs.readFileSync(path.join(source, sourcePath), 'utf8')
    };
});
fs.writeFileSync(
    path.join(output, 'curriculum.json'),
    JSON.stringify(
        { importedAt: new Date().toISOString(), sourcePath: path.resolve(source), weeks },
        null,
        2
    )
);
console.log(`Imported ${weeks.length} curriculum weeks.`);
