# DSA Study Buddy textbook

This folder holds the Markdown chapters you read in the learning app. There are now 17 independent modules: the original combined complexity-and-arrays chapter has been split into two. We keep existing identifiers so the split does not change the meaning of saved progress. The [earlier curriculum audit](../curriculum-coverage.md) records the original sixteen-week comparison and predates that split.

## Chapters

| Week | Chapter |
| --- | --- |
| 1 | [Introduction to Algorithm Complexity](week-01.md) |
| 17 (second in learning order) | [Arrays and Array Operations](week-17.md) |
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

Each filename has a stable two-digit module identifier. Arrays has identifier 17 but comes second in the learning sequence: do not renumber files to make their names consecutive. The first line is `# Week N - Title`, followed by a welcome explaining what we will learn and why it matters. Each reading section has an explicit `lesson-id` comment. Keep that key when improving its explanation; saved progress refers to it. YAML frontmatter is unnecessary.

Chapters 2–16 use these second-level headings in order. Complexity and arrays have their own expanded sections:

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

Start with the problem we want to solve. Explain the idea in familiar language, then introduce its technical name. Use concrete inputs to show why each step works. A short sentence is useful; a missing explanation is not. Keep proofs, edge cases, operation counts, assessments and worked solutions when simplifying the surrounding language.

Give every JavaScript example a descriptive `### Demonstration N — Title` heading immediately before its fence. Number examples within each second-level reading section, starting again at 1 in the next section. Explain its purpose before the heading and walk through the important statements afterwards. Refer to “Demonstration 2” rather than “the code above”. When referring to an example in another section, name that section too.

Keep important distinctions clear: working memory is different from returned output; an expected hash-map lookup cost is not a worst-case guarantee; JavaScript's array behaviour does not promise a particular engine implementation. A passing structure test cannot establish textbook quality.

Runnable `javascript` fences are complete independent programs. Put their exact printed output in the immediately following `output` fence. Use `console.log(JSON.stringify(value))` for reproducible array/object output. Intentionally incorrect debugging snippets use `javascript-bug` so they are visibly distinct and not executed as correct examples. Use fenced `text` diagrams and Markdown tables; Mermaid execution is not enabled.

Relative chapter links such as `[hash maps](week-02.md)` become authenticated module links in the reader. Section links use the section's generated slug. Do not add raw HTML, executable scripts, embedded iframes or arbitrary filesystem references. Markdown is rendered through React with raw HTML disabled and unsafe link schemes filtered.

## Checklist identifiers and persistence

Every final checklist item carries an explicit identifier:

This source example shows the comment that ties one learning outcome to its saved checkbox.

### Demonstration 1 — Give a checklist outcome a stable key

```text
- [ ] I can distinguish an upper bound from a tight bound. <!-- checkpoint:w1-upper-tight-bounds -->
```

In Demonstration 1, the sentence is visible to the learner and the comment supplies the persistence key. Its prefix must match the chapter. Identifiers are unique, descriptive, lower-case and at most 120 characters. Keep the key when rewriting the sentence, and never derive it from list position. Do not reuse a retired key for a different learning outcome.

The reader turns valid task items into React checkboxes and saves through the authenticated progress API. Markdown files remain unchanged. Each user's completion is stored separately in PostgreSQL; clearing a checkbox reverses its completion. Loading and saving failures must be shown rather than silently treating unsaved work as complete.

Explicit reading-lesson completion, descriptive checklist outcomes and the original `wN-0`, `wN-1`, `wN-2` mastery checks are separate records. The shared progress model calculates reading completion from saved lesson identifiers. Opening a lesson is not completing it. Saving a reading checkpoint must not overwrite legacy mastery records or another user's progress.

## Loading and deployment

The frontend does not fetch repository files or bundle these chapters into public Vite assets. The Express curriculum endpoint reads the matching file only after the existing authentication guard. The Markdown adapter splits headings for the module sidebar; the React renderer handles paragraphs, lists, code, tables, links and checklist controls.

Deploy the backend with this directory and the existing `shared/` directory included at their repository-relative paths. Starting Node from `backend/` is fine because paths are resolved relative to the loader module, not the process working directory. A deployment package containing only `backend/` is insufficient. Publish content changes with the backend; publish renderer changes with the Vite frontend. No database migration or frontend secret is needed for the new checkpoint IDs.

The [archived combined chapter](archive/week-01-complexity-and-arrays.md) is retained as teaching material, not loaded as another module. Its wording can be improved, so it is not a byte-for-byte historical snapshot. Edit [week-01.md](week-01.md) for the active complexity chapter and [week-17.md](week-17.md) for arrays. There should be no second root-level `weekly_content/` copy.

## Sources, originality and verification

Each chapter records its consulted references and selected official practice links. Original examples and solutions explain strategies without reproducing platform statements or proprietary editorials. Links were checked during authoring where access was available; a site returning an access challenge is not evidence that its content was reviewed. Any such limitation belongs beside the affected reference.

Run the automated checks from the repository root. These commands validate content and application behaviour; they do not publish a deployment.

### Demonstration 1 — Run the content and application checks

```bash
npm run build
npm test
npm --prefix frontend test
```

In Demonstration 1, the build command creates production frontend assets. The root tests check file mappings, headings, internal links, stable progress identifiers, JavaScript execution and documented outputs. The frontend tests check rendering and application behaviour. There is no separate root lint command currently configured. These checks do not prove correctness for every input, guarantee third-party availability, or replace editorial review. Live cross-device persistence also needs a configured PostgreSQL backend and an authenticated browser session.

## What regression checks can tell us

The conversational-rewrite baseline protects the original chapter headings, lesson and checkpoint keys, example code and output, mathematical expressions and teaching tables. Tests also check sequential demonstration labels. These checks help catch accidental content loss, but they do not independently certify every explanation or replace a teacher's review. External resources may change, and automated local-link checks do not establish their continued availability. A successful build is not a live production persistence test.
