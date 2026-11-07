# Conversational curriculum rewrite

## Scope

All 17 active learning chapters and the retained combined chapter were rewritten in place. This is a teaching-prose revision, not a new curriculum or application architecture. Operational deployment, authentication, security and API documentation were not treated as DSA lessons.

The writing now explains unfamiliar terms, follows concrete inputs, separates assumptions from guarantees, and connects the code to its operation counts. Worked proofs, assessments, solutions, checklists, resources and algorithm preconditions remain. Code demonstrations have numbered descriptive headings, a purpose before the example, and an explicit numbered walk-through afterward. Numbers restart within each second-level reading section; references to other sections name their destination.

## Completed chapter inventory

Stable week identifiers are listed below, not display positions. Arrays (identifier 17) remains the second module in the learning sequence. Every row is complete for this rewrite.

| Chapter | Runnable demonstrations | Deliberately broken demonstrations | Prose words before → after |
| --- | --- | --- | --- |
| [Week 1 - Introduction to Algorithm Complexity](weekly_content/week-01.md) | 9 | 0 | 6,774 → 10,471 |
| [Week 2 - Hash Maps and Sets](weekly_content/week-02.md) | 8 | 1 | 4,703 → 6,882 |
| [Week 3 - Two Pointers](weekly_content/week-03.md) | 7 | 1 | 4,737 → 6,718 |
| [Week 4 - Sliding Window](weekly_content/week-04.md) | 6 | 1 | 5,243 → 7,138 |
| [Week 5 - Stacks and Queues](weekly_content/week-05.md) | 5 | 1 | 2,213 → 3,613 |
| [Week 6 - Binary Search](weekly_content/week-06.md) | 5 | 1 | 2,331 → 3,508 |
| [Week 7 - Linked Lists](weekly_content/week-07.md) | 5 | 1 | 2,393 → 3,617 |
| [Week 8 - Recursion and Backtracking](weekly_content/week-08.md) | 6 | 1 | 2,754 → 4,025 |
| [Week 9 - Binary Trees](weekly_content/week-09.md) | 6 | 1 | 2,556 → 3,774 |
| [Week 10 - BSTs and Heaps](weekly_content/week-10.md) | 3 | 1 | 2,951 → 4,189 |
| [Week 11 - Graph Foundations](weekly_content/week-11.md) | 4 | 1 | 1,999 → 3,711 |
| [Week 12 - Advanced Graphs](weekly_content/week-12.md) | 4 | 1 | 2,290 → 3,188 |
| [Week 13 - Greedy and Intervals](weekly_content/week-13.md) | 4 | 1 | 2,098 → 3,035 |
| [Week 14 - Dynamic Programming I](weekly_content/week-14.md) | 4 | 1 | 2,406 → 3,285 |
| [Week 15 - Dynamic Programming II and Tries](weekly_content/week-15.md) | 6 | 1 | 2,844 → 3,790 |
| [Week 16 - Interview Consolidation](weekly_content/week-16.md) | 3 | 1 | 2,749 → 3,684 |
| [Week 17 - Arrays and Array Operations](weekly_content/week-17.md) | 23 | 0 | 7,242 → 11,335 |
| [Week 1 - Complexity and Arrays](weekly_content/archive/week-01-complexity-and-arrays.md) | 11 | 1 | 5,013 → 7,318 |

Word counts exclude fenced code and HTML metadata comments. They are a check against accidental shortening, not a measure of educational quality. The chapters total 93,281 prose words after the rewrite, compared with 63,296 before it.

## Compatibility checks

The [regression suite](../tests/conversational-content.test.js) compares the rewritten chapters with a [pre-rewrite fixture](../tests/fixtures/curriculum-rewrite-baseline.json). All original H1/H2 headings, 262 lesson metadata identifiers and 178 checklist identifiers remain in order. These counts include the archived chapter where applicable.

All 119 runnable JavaScript demonstrations, 16 intentionally broken snippets, diagrams and documented output fences retain their original contents. Original mathematical inline expressions and teaching tables are protected too. No migration, dependency, environment-variable, renderer, route or authentication change was needed for this rewrite. Pre-existing checkpoint-persistence work in the checkout was preserved.

The archived chapter had six relative-link occurrences pointing one directory too shallow. Their destinations were corrected explicitly, rather than dropping the links. External resource destinations were otherwise retained. The archive is retained teaching material, not a byte-identical historical snapshot or another active module.

The [authoring guide](weekly_content/README.md) and [content architecture notes](textbook-content.md) now explain the current 17-module structure, stable identifiers and demonstration conventions.

## Executed validation

- `node tests/conversational-content.test.js`: 18 chapter checks passed.
- `node tests/weekly-content.test.js`: 56 checks passed, including running all 119 correct JavaScript examples against their documented outputs, internal links, archive resources, content structure and checkpoint conventions. Broken debugging snippets are intentionally not run as correct algorithms.
- `npm test`: all 19 root test-file groups passed, including syntax, curriculum, progress, authentication and content checks.
- `npm --prefix frontend test`: all 27 tests across four files passed, including rendering all 17 real chapters.
- `npm run build`: Vite production build and prerender command passed.
- `git diff --check`: passed.
- A read-only comparison with the previous Git revision found no unchanged substantive prose paragraphs longer than 20 words after excluding code, metadata, headings, lists and tables. This guards against merely appending summaries; it does not establish teaching quality.

There is no separate root lint command configured.

## Limits

Automated execution checks the supplied example inputs, not every possible input or every proof. The wording and more involved arguments received editorial spot checks, not independent textbook peer review. Third-party resources were not live-revalidated during this rewrite; URL preservation and local-link resolution are not availability guarantees.

All active chapters were rendered through the existing React Markdown tests, but no live browser, screen-reader, mobile visual or deployed production review was performed in this pass. No production progress write or deployment was performed. The existing collapsed solution and checklist mechanisms remain unchanged.

