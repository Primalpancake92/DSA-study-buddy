# Independent complexity and arrays modules

## Ordering and stable identifiers

The programme now has **17 modules**. Algorithm Complexity is first, Arrays is second, and the original Hash Maps through Interview Consolidation modules follow unchanged. Existing week-based URLs and persistence keys remain stable:

| Display module | Stable ID / route | Canonical Markdown |
| --- | --- | --- |
| 1 — Introduction to Algorithm Complexity | `/app/weeks/1` | `weekly_content/week-01.md` |
| 2 — Arrays and Array Operations | `/app/weeks/17` | `weekly_content/week-17.md` |
| 3 — Hash Maps and Sets | `/app/weeks/2` | `weekly_content/week-02.md` |
| 17 — Interview Consolidation | `/app/weeks/16` | `weekly_content/week-16.md` |

IDs are not positions. `sequence`, `previousModuleId`, and `nextModuleId` follow the shared curriculum ordering. Both foundational modules can be studied within the original first week's schedule; the existing 16-week programme is not silently relabelled as 17 weeks. Recommendations, the catalogue, roadmap and reader use module sequence labels. Other chapters retain their original week identities and links.

The original combined chapter is preserved in [the archive](./weekly_content/archive/week-01-complexity-and-arrays.md). It is not an active curriculum module or public endpoint. The existing Markdown loader remains the canonical content path. No new renderer, ORM or dependency is introduced.

## Content and interactions

Complexity teaches operation counting, input size, cost models, growth families, upper/lower/tight bounds, constants and thresholds, case versus bound notation, time/space, loop sums, proofs and JavaScript examples. Its interactive lab provides adjustable step-by-step linear search, six representative growth curves and the `3n + 7` bounds example. The growth chart explicitly uses a logarithmic vertical scale; its table provides actual untransformed values.

Arrays develops representation, indexing, traversal, mutation, copying, method contracts, callback costs, pointers and complete worked array problems. Its traversal lab remains available. Each module has its own lessons, explicit completion controls, mastery checklist and assessment. Assessment answers use the existing collapsed solutions interface and are not auto-opened by appearance preferences.

External coding problems formerly assigned to the combined first chapter move to Arrays without changing problem IDs, notes, attempts or review records. Complexity's assessment is local and mathematical; it does not show unrelated coding-platform cards merely to fill a quota.

## Progress migration and recovery

Run `npm run migrate` **before deploying the new backend**. Migration `007_split_foundations.sql`:

1. Widens the existing module-number check constraint to permit stable ID 17.
2. Adds an uncompleted Arrays progress row for each existing account.
3. Copies seven exact array concept checkpoint mappings from `w1-*` to `w17-*` using `ON CONFLICT DO NOTHING`.

It never deletes, renumbers or overwrites existing lesson, account, practice or progress rows. Repeated execution preserves newer destination progress, including a checkpoint the learner has subsequently reopened.

Existing completed module ID 1 remains completed for Complexity. It does **not** automatically complete Arrays. Old mixed section-completion records are retained but not falsely assigned to an individual new lesson: a combined core-theory section is not proof that all lessons of either expanded module were studied. Exact conceptual checkpoints remain visible in the corresponding new checklist. New reading lesson IDs are independent and begin uncompleted unless their exact ID already exists. This means section percentages may differ from the former combined chapter; no historical records are erased.

Take a database backup before production migration. Recovery normally means redeploying the prior application while retaining the additive ID-17 rows and copied checkpoints; do not renumber data backwards or shrink the constraint while ID 17 exists. The archived original chapter and unchanged original checkpoint rows provide recovery evidence. No session or password data is modified.

## Validation and deployment

Run `npm test`, `npm --prefix frontend test`, and `npm run build`. There is no configured lint command; the repository's backend/shared syntax regression test and Prettier checks are used. Runnable Markdown examples are executed against adjacent expected-output fences. Tests cover graph models, threshold arithmetic, module ordering, independent progress, real anchors and source links.

`node src/check-learning-integration.js` from the backend directory validates migrations in a random isolated schema within one transaction, including reruns and progress preservation, then rolls everything back. It requires an authorised PostgreSQL connection and schema-creation permission; it does not migrate production records. This check is distinct from actually applying migrations.

Deploy backend and frontend together after applying the migration. No new environment variables are required. Production browser and account workflows still require deployment verification; local test results do not establish production success.

References checked for integration include [MIT 6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), [OpenDSA asymptotic analysis](https://opendsa.cs.vt.edu/ODSA/Books/CSC3280/html/AnalAsymptotic.html), [Open Data Structures](https://www.opendatastructures.org/ods-python/1_3_Mathematical_Background.html), and [MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array). Explanations and examples are original, not copied textbook passages.

## Changed-file inventory

- Content: [Complexity](./weekly_content/week-01.md), [Arrays](./weekly_content/week-17.md), the [original archive](./weekly_content/archive/week-01-complexity-and-arrays.md), and prerequisite links in chapters 02, 03, 05 and 06.
- Metadata: [curriculum](../shared/curriculum.js), [foundation metadata](../shared/foundationModules.js), [public preview](../shared/curriculumPreview.js), [practice mappings](../shared/practiceCatalog.js).
- Backend: [Markdown loader](../backend/src/markdownLesson.js), [API integration](../backend/src/app.js), [practice validation](../backend/src/practiceRoutes.js), [reminder labels](../backend/src/learningReminders.js), [migration](../backend/migrations/007_split_foundations.sql), and [isolated integration check](../backend/src/check-learning-integration.js).
- Frontend: [reader](../frontend/src/pages/LessonPage.jsx), [catalogue](../frontend/src/pages/ModulesPage.jsx), [dashboard](../frontend/src/pages/DashboardPage.jsx), [landing label](../frontend/src/pages/LandingPage.jsx), [Markdown links](../frontend/src/components/MarkdownChapter.jsx), [roadmap canvas](../frontend/src/components/roadmap/RoadmapCanvas.jsx), [detail modal](../frontend/src/components/roadmap/RoadmapDetailModal.jsx), and [recommendation metadata](../frontend/src/services/learningRecommendations.js).
- Interactions: [ComplexityLab](../frontend/src/components/ComplexityLab.jsx), [pure models](../frontend/src/services/complexityModels.js), [styles](../frontend/src/styles/complexity.css). The existing array traversal component is reused rather than duplicated.
- Tests: new [foundations coverage](../tests/complexity-foundations.test.js) and [lab rendering](../frontend/src/components/ComplexityLab.test.jsx); updated curriculum, roadmap, practice, recommendation, Markdown rendering and runnable-content tests for the new canonical ordering and chapter scope.

## Executed checks

- `npm test`: all 17 root test files passed, including backend/shared syntax checks.
- `npm --prefix frontend test`: 22 tests passed across four files.
- `npm run build`: Vite production build and public prerender passed.
- The two foundational chapters contain 32 runnable JavaScript examples; all matched their adjacent expected output. The content harness also checked all 17 chapters, their local links and checkpoint metadata.
- The PostgreSQL integration check passed against an isolated temporary schema, including migration reruns, exact checkpoint copying, untouched existing module records and user isolation. All fixture changes were rolled back.
- Prettier formatting and `git diff --check` passed. No lint script is configured.

These are local/isolated integration results, not a claim of a deployed end-to-end browser test or applied production migration.
