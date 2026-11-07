# Progress-based lesson recommendations

The authenticated curriculum API derives lesson metadata from the same Markdown chapter sections used by the reader. IDs use `w{week}-section-{sectionId}`; titles and ordering are not duplicated in the dashboard. Reading times are estimates at 220 words/minute, not measured study time.

Recommendations resume the most recently saved incomplete section first, then choose the next incomplete section of the earliest partially completed module, then the earliest available incomplete module. Completed items and unavailable modules are excluded. An empty curriculum is not treated as full completion.

The existing `lesson_progress` table stores section starts and explicit completion, using its existing `status` and `updated_at` fields. Visiting a section records a start, never a completion. The reader provides a **Mark lesson complete** control. The existing protected, CSRF-checked progress API and account-scoped queries are reused. No migration or environment variable is required.

The dashboard, roadmap, catalogue, and reader calculate section progress as distinct completed reading lessons divided by distinct available reading lessons. Existing completed module records remain authoritative so previously completed modules do not become unfinished after this addition. Existing mastery and practice checkpoints are preserved but are not miscounted as reading lessons. Historical section visits cannot be reconstructed; a user without section records starts at the beginning of their first incomplete module.

Progress is refreshed from PostgreSQL on navigation/refresh, and successful saves notify subscribed components. Failed reads suppress recommendations rather than treating unknown progress as zero. Failed writes retain saved progress and expose a retryable error. Changes made in another browser tab are picked up on the next progress refresh; there is no realtime subscription.

Forgot Password trims and validates input before sending a request and repeats validation on the server before database access. Valid-format requests retain the existing account-independent confirmation and reset delivery mechanism. This change does not configure or replace that delivery mechanism.

Production verification still requires deploying both applications and testing a configured password-reset delivery channel and an authenticated learning session. Automated tests do not send real reset emails.
