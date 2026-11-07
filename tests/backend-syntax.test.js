import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function javascriptFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? javascriptFiles(path) : path.endsWith('.js') ? [path] : [];
    });
}

test('all backend and shared JavaScript parses before deployment', () => {
    for (const directory of ['../backend/src/', '../shared/']) {
        for (const path of javascriptFiles(fileURLToPath(new URL(directory, import.meta.url)))) {
            const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
            assert.equal(result.status, 0, `Syntax check failed: ${path}\n${result.stderr}`);
        }
    }
});
