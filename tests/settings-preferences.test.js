import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings } from '../shared/settingsDefaults.js';
import { getLearningReminders } from '../backend/src/learningReminders.js';
import { recommendPractice } from '../frontend/src/services/practiceModel.js';
import { readFile } from 'node:fs/promises';

test('disabled notification categories issue no learning-data queries', async () => {
    const settings = structuredClone(defaultSettings);
    for (const key of Object.keys(settings.notifications)) settings.notifications[key] = false;
    let calls = 0;
    const reminders = await getLearningReminders(
        {
            async query(sql, values) {
                calls++;
                assert.equal(values[0], 'owner');
                assert.match(sql, /user_settings/);
                return { rows: [{ preferences: settings }] };
            }
        },
        'owner'
    );
    assert.deepEqual(reminders, []);
    assert.equal(calls, 1);
});
test('enabled in-app reminders derive actual records and scope every query', async () => {
    const settings = structuredClone(defaultSettings);
    const db = {
        async query(sql, values) {
            assert.deepEqual(values, ['owner']);
            if (sql.includes('user_settings')) return { rows: [{ preferences: settings }] };
            if (sql.includes('review_queue'))
                return { rows: [{ lesson_id: 'practice:fixture', due_at: new Date() }] };
            if (sql.includes('lesson_progress')) return { rows: [{ completed: 2 }] };
            if (sql.includes('user_progress')) return { rows: [{ week_number: 4 }] };
            throw Error('Unexpected query');
        }
    };
    const reminders = await getLearningReminders(db, 'owner');
    assert.equal(reminders.length, 4);
    assert.match(reminders[0].text, /30 minutes/);
    assert.match(reminders[2].text, /^2 lesson/);
    assert.equal(reminders[3].href, '/app/weeks/4');
});
test('preferred difficulty and revision settings change recommendations without hiding problems', () => {
    const sample = ['Easy', 'Medium', 'Hard'].map((difficulty, i) => ({
        id: String(i),
        difficulty,
        progress: { status: 'not-started' }
    }));
    assert.equal(
        recommendPractice(sample, Date.now(), { difficulty: 'advanced' })[0].difficulty,
        'Hard'
    );
    assert.equal(
        recommendPractice(sample, Date.now(), { difficulty: 'beginner' })[0].difficulty,
        'Easy'
    );
    sample[2].progress.status = 'review-needed';
    assert.equal(recommendPractice(sample)[0].id, '2');
    assert.equal(recommendPractice(sample, Date.now(), { revisionExercises: false })[0].id, '0');
});
test('all settings sections are nested protected routes and theme bootstrap contains no auth storage', async () => {
    const source = await readFile(new URL('../frontend/src/App.jsx', import.meta.url), 'utf8');
    for (const path of [
        'profile',
        'security',
        'connections',
        'learning',
        'notifications',
        'accessibility',
        'appearance',
        'privacy'
    ])
        assert.ok(source.includes(`path="${path}"`));
    assert.ok(
        source.indexOf('path="/app/settings"') >
            source.indexOf('<Route element={<ProtectedRoute />}')
    );
    const html = await readFile(new URL('../frontend/index.html', import.meta.url), 'utf8');
    assert.match(html, /localStorage\.getItem\('dsa-theme'\)/);
    assert.doesNotMatch(html, /localStorage.*(?:sessionId|csrfToken|password)/);
});
