import { readFile } from 'node:fs/promises';
import { getLesson } from '../../shared/curriculum.js';

// Only the authenticated server imports this module. Never expose this directory statically.
export async function loadLesson(weekNumber) {
  const legacy = getLesson(weekNumber);
  if (!legacy) return null;
  const markdown = await readFile(new URL(`../../docs/weekly_content/week-${String(weekNumber).padStart(2, '0')}.md`, import.meta.url), 'utf8');
  if (!markdown.startsWith(`# Week ${weekNumber} - ${legacy.title}\n`)) {
    throw new Error(`Chapter ${weekNumber} has invalid identity metadata.`);
  }
  const sections = [];
  const used = new Set(['coding-practice', 'module-summary-and-mastery']);
  let title = legacy.title;
  let current = { id: 'chapter-introduction', title: 'Introduction', markdown: '' };
  let fence = null;
  for (const line of markdown.split(/\r?\n/)) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (delimiter) {
      if (!fence) fence = delimiter[1];
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && /^ {0,3}(?:`+|~+)\s*$/.test(line)) fence = null;
      current.markdown += `${line}\n`;
      continue;
    }
    if (!fence) {
      const heading = line.match(/^# Week (\d+) - (.+)$/);
      if (heading && Number(heading[1]) === weekNumber) { title = heading[2]; continue; }
      const section = line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (section) {
        if (current.markdown.trim()) sections.push(current);
        const slug = section[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let id = slug;
        let suffix = 2;
        while (used.has(id) || id === 'chapter-introduction') id = `${slug}-${suffix++}`;
        used.add(id);
        current = { id, title: section[1], markdown: '' };
        continue;
      }
    }
    current.markdown += `${line}\n`;
  }
  if (current.markdown.trim()) sections.push(current);
  const checklistIndex = sections.findIndex((section) => section.id === 'weekly-progress-checklist');
  if (checklistIndex < 0) throw new Error(`Chapter ${weekNumber} is missing its progress checklist.`);
  sections.splice(checklistIndex, 0, { id: 'module-summary-and-mastery', title: 'Mastery checkpoint', body: '' });
  const { id, concepts, checkpoint, problems, resources } = legacy;
  return { id, concepts, checkpoint, problems, resources, title, sourcePath: `docs/weekly_content/week-${String(weekNumber).padStart(2, '0')}.md`, sections,
    readingWords: markdown.replace(/<!--[\s\S]*?-->/g, '').split(/\s+/).filter(Boolean).length };
}
