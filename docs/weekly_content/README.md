# DSA Study Buddy textbook

This directory is the canonical educational Markdown source for the sixteen authenticated weekly modules. The syllabus order is unchanged. See the [curriculum audit and coverage report](../curriculum-coverage.md) for the comparison with the related curriculum repository and the original assignment list.

## Chapters

| Week | Chapter |
| --- | --- |
| 1 | [Complexity and Arrays](week-01.md) |
| 2 | [Hash Maps and Sets](week-02.md) |
| 3 | [Two Pointers](week-03.md) |
| 4 | [Sliding Window](week-04.md) |
| 5 | [Stacks and Queues](week-05.md) |
| 6 | [Binary Search](week-06.md) |
| 7 | [Linked Lists](week-07.md) |
| 8 | [Recursion and Backtracking](week-08.md) |
| 9 | [Binary Trees](week-09.md) |
| 10 | [BSTs and Heaps](week-10.md) |
| 11 | [Graph Foundations](week-11.md) |
| 12 | [Advanced Graphs](week-12.md) |
| 13 | [Greedy and Intervals](week-13.md) |
| 14 | [Dynamic Programming I](week-14.md) |
| 15 | [Dynamic Programming II and Tries](week-15.md) |
| 16 | [Interview Consolidation](week-16.md) |

## Authoring contract

Each filename has a stable two-digit week number. The first line is `# Week N - Title`, followed by a specific welcome explaining the concepts, motivation, learning outcomes and final progress checklist. Metadata is derived from the existing curriculum catalogue and filename; YAML frontmatter is unnecessary.

Each chapter has these second-level headings in order:

1. Learning Objectives
2. Prerequisite Knowledge
3. Core Theory
4. JavaScript Implementations
5. Worked Examples
6. Visual Explanations
7. Complexity Analysis
8. Common Mistakes
9. Interview and LeetCode Pattern Recognition
10. Practice Exercises
11. Hints and Worked Solutions
12. Sources and Further Reading
13. Weekly Summary
14. Weekly Progress Checklist

Use third-level headings to develop concepts within a section. Prefer connected explanations, original examples and explicit preconditions to bare definitions. Distinguish auxiliary memory from returned output, expected hashing from worst-case bounds, and an abstract array model from ECMAScript's behavioral requirements. A passing structure test is not proof of textbook quality.

Runnable `javascript` fences are complete independent programs. Put their exact printed output in the immediately following `output` fence. Use `console.log(JSON.stringify(value))` for reproducible array/object output. Intentionally incorrect debugging snippets use `javascript-bug` so they are visibly distinct and not executed as correct examples. Use fenced `text` diagrams and Markdown tables; Mermaid execution is not enabled.

Relative chapter links such as `[hash maps](week-02.md)` become authenticated module links in the reader. Section links use the section's generated slug. Do not add raw HTML, executable scripts, embedded iframes or arbitrary filesystem references. Markdown is rendered through React with raw HTML disabled and unsafe link schemes filtered.

## Checklist identifiers and persistence

Every final checklist item carries an explicit identifier:

```text
- [ ] I can distinguish an upper bound from a tight bound. <!-- checkpoint:w1-upper-tight-bounds -->
```

The week prefix must match the chapter. Identifiers are unique, descriptive, lower-case and at most 120 characters. Never derive them from list position or change them just because prose is reworded: existing user progress refers to these keys. Do not reuse a retired key for a different learning outcome.

The reader turns valid task items into React checkboxes and saves through the authenticated progress API. Markdown files remain unchanged. Each user's completion is stored separately in PostgreSQL; clearing a checkbox reverses its completion. Loading and saving failures must be shown rather than silently treating unsaved work as complete.

The original `wN-0`, `wN-1`, `wN-2` mastery IDs remain separate from descriptive reading-checklist IDs. Existing module completion continues to use those mastery checks. A checked reading task therefore cannot accidentally complete a module or overwrite a previously saved mastery record.

## Loading and deployment

The frontend does not fetch repository files or bundle these chapters into public Vite assets. The Express curriculum endpoint reads the matching file only after the existing authentication guard. The Markdown adapter splits headings for the module sidebar; the React renderer handles paragraphs, lists, code, tables, links and checklist controls.

Deploy the backend with this directory and the existing `shared/` directory included at their repository-relative paths. Starting Node from `backend/` is fine because paths are resolved relative to the loader module, not the process working directory. A deployment package containing only `backend/` is insufficient. Publish content changes with the backend; publish renderer changes with the Vite frontend. No database migration or frontend secret is needed for the new checkpoint IDs.

The initial short Week 1 draft informed the requested introduction format; it is not a runtime source. Edit [week-01.md](week-01.md) for the actual Week 1 chapter. There should be no second root-level `weekly_content/` copy.

## Sources, originality and verification

Each chapter records its consulted references and selected official practice links. Original examples and solutions explain strategies without reproducing platform statements or proprietary editorials. Links were checked during authoring where access was available; a site returning an access challenge is not evidence that its content was reviewed. Any such limitation belongs beside the affected reference.

Run the automated checks from the repository root:

```bash
npm run build
npm test
npm --prefix frontend test
```

Content tests cover file mappings, headings, internal links, stable checklist IDs, JavaScript parsing and execution, and documented outputs. Application tests additionally check the content boundary and safe rendering. These checks do not prove correctness for every input, guarantee third-party availability, or replace editorial review. Live cross-device persistence also depends on a functioning configured PostgreSQL backend and authenticated browser session.

## Implementation verification

The implementation run validated all sixteen chapters, including 87 standalone JavaScript examples and 148 stable reading-checklist items. The content suite exercises each documented output; the frontend suite renders every actual chapter through the React Markdown component. The existing root test command and production Vite build passed, including backend/shared JavaScript syntax checks. Fifteen frontend tests cover rendering, link/HTML handling, checkbox hydration, save failure, serialized writes and stale responses after logout or a concurrent refresh.

A local API startup check returned 200 for the service root, 401 for unauthenticated lesson/progress requests, and 404 for direct access to a chapter filesystem path. The temporary API process was stopped after testing. No deployment, migration, email or production progress write was performed.

Remaining verification limits: authenticated browser saves against a live PostgreSQL account and refreshes on a second device were not exercised. Persistence uses the existing authenticated, user-scoped endpoint and is covered at the frontend contract level, not by a newly performed cross-device test. ASCII diagrams are supported; Mermaid is intentionally not enabled. External sources document their own access limitations, and the chapters are original authored teaching material rather than independently peer-reviewed textbook content.
