# Textbook content architecture and review status

The teaching source lives in [docs/weekly_content](weekly_content/README.md). Express reads the 17 active Markdown chapters through the protected curriculum API; Vite does not import their text into public assets. Complexity keeps identifier 1, and arrays uses identifier 17 while appearing second in the learning order. The older shared textbook blocks remain legacy source material. Existing catalogue and progress identifiers stay in place.

Second-level Markdown headings define reading sections. Explicit `lesson-id` comments tie each section to its saved reading progress. The final checklist uses separate `wN-descriptive-slug` identifiers; legacy numeric `wN-index` mastery identifiers remain separate too. PostgreSQL stores each user's completion records, never the shared Markdown files. Opening a section does not mark it complete.

The reader renders Markdown through React with raw HTML disabled and unsafe link schemes filtered. Code and text diagrams remain inert. Tables and code support horizontal overflow on narrow screens; the existing table of contents and adjacent-module navigation remain available.

The [earlier curriculum audit](curriculum-coverage.md) compares the original sixteen-week catalogue with the upstream material and predates the complexity/arrays split. Chapter source notes retain references and access limitations; they do not imply review of inaccessible resources. Existing problem and resource metadata is preserved.

Each JavaScript example has a numbered demonstration heading and a walk-through. Numbering restarts in each second-level section, so a reference to another section must name it. Automated tests execute standalone JavaScript fences in fresh VM contexts with timeouts and compare the adjacent documented output. Deliberately broken debugging snippets are marked separately. Regression checks protect original examples, mathematical expressions, tables, headings and progress keys during prose changes. Passing these checks cannot establish correctness for every input or independently certify the writing. See the [content README](weekly_content/README.md) for authoring and deployment rules.

Roadmap layout uses the normal page margins and transparent structural wrappers. It grows with the document instead of nesting a fixed-height vertical scroll panel. Desktop fits the graph width; mobile keeps a readable minimum scale and centres the main spine with horizontal branch panning. Zoom positions are UI state, never progress records. Modal selection/dismissal logic is unchanged.
