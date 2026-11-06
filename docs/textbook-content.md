# Textbook content architecture and review status

The canonical teaching source is now [docs/weekly_content](weekly_content/README.md). The protected curriculum API reads `week-01.md` through `week-16.md` on the Express side; Vite does not import the chapter text into public assets. The old `shared/textbook/` blocks remain legacy source material, not the active Markdown teaching source. Catalogue metadata and legacy mastery identifiers are retained for compatibility.

Second-level Markdown headings define reading sections. The final checklist uses explicit `wN-descriptive-slug` identifiers stored in the existing per-user progress table, never in shared content files. Existing numeric `wN-index` mastery identifiers and checkpoint counts are separate and unchanged. Reading-checklist progress does not automatically imply lesson mastery.

The reader renders Markdown through React with raw HTML disabled and unsafe link schemes filtered. Code and text diagrams remain inert. Tables and code support horizontal overflow on narrow screens; the existing table of contents and adjacent-module navigation remain available.

The [curriculum audit](curriculum-coverage.md) compares the application's actual catalogue with all sixteen upstream weekly files accessed through GitHub. Their sequence agrees. Chapter-level source notes record consulted references, verified problem pages and access limitations; they do not claim review of inaccessible resources. Existing problem/resource metadata is preserved.

Validation distinguishes executable examples from educational review: automated tests execute standalone JavaScript fences in fresh VM contexts with timeouts, compare adjacent documented outputs, check the full chapter scaffold and internal links, and verify stable checklist identities and protected mappings. Debugging examples are explicitly labelled as incorrect. Passing examples do not establish correctness for all inputs or independently certify the prose. See the [content README](weekly_content/README.md) for authoring and deployment rules.

Roadmap layout uses the normal page margins and transparent structural wrappers. It grows with the document instead of nesting a fixed-height vertical scroll panel. Desktop fits the graph width; mobile keeps a readable minimum scale and centres the main spine with horizontal branch panning. Zoom positions are UI state, never progress records. Modal selection/dismissal logic is unchanged.
