# Textbook content architecture and review status

The protected curriculum API combines the existing catalogue and stable overview anchors with authored concept chapters in `shared/textbook/`. Content stays on the Express side; React imports only a block renderer, not the textbook files. The four content modules divide maintenance by week ranges without copying curriculum data into the roadmap.

Each concept has a stable `wN-topic` section ID and an ordered list of paragraph, code, state-diagram and exercise blocks. Exercises expose progressive hints and solutions only when the learner opens native disclosure controls. These disclosures do not mark exercises complete. Existing `wN-index` mastery identifiers and checkpoint counts are unchanged.

The reader renders inert text through React, applies lightweight JavaScript lexical highlighting, keeps code/diagrams horizontally scrollable on small screens, and provides a sticky table of contents, active-section indication and previous/next module links. Existing overview anchors remain available for bookmarked URLs.

Source limitation: this checkout does not contain the referenced `weeks/`, `guides/`, `resources/` or `STUDY-PLAYBOOK.md` files. Chapters follow the actual titles/concepts in `shared/curriculum.js`. No missing LeetCode assignments or lecture links are fabricated. Reconciling the original source readings, assignments and lecture lists requires those files. The existing problem/resource records are preserved.

Validation distinguishes executable examples from educational review: automated tests execute each complete JavaScript block in an isolated VM with a timeout, check every module has structured concept chapters, exercises with hints/solutions, diagrams and unique anchors, and retain old overview sections. Execution checks do not establish correctness for all inputs or independently certify the prose. Additional scenario/output checks should accompany algorithms as the curriculum evolves.

Roadmap layout uses the normal page margins and transparent structural wrappers. It grows with the document instead of nesting a fixed-height vertical scroll panel. Desktop fits the graph width; mobile keeps a readable minimum scale and centres the main spine with horizontal branch panning. Zoom positions are UI state, never progress records. Modal selection/dismissal logic is unchanged.
