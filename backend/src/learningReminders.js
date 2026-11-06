import { getSettings } from './settingsModel.js';

export async function getLearningReminders(pool, userId) {
  const settings = await getSettings(pool, userId);
  const reminders = [];
  if (settings.notifications.study) reminders.push({ id: 'study', text: `Your study plan: ${settings.learning.dailyMinutes} minutes a day, ${settings.learning.daysPerWeek} days a week. Study time is not automatically measured.`, href: '/app/modules' });
  if (settings.notifications.reviews && settings.learning.revisionExercises) {
    const { rows } = await pool.query('SELECT lesson_id, due_at FROM review_queue WHERE user_id = $1 AND due_at <= now() ORDER BY due_at LIMIT 5', [userId]);
    for (const row of rows) reminders.push({ id: `review:${row.lesson_id}`, text: `A saved ${row.lesson_id.startsWith('practice:') ? 'practice problem' : 'lesson'} is due for review.`, href: '/app/modules' });
  }
  if (settings.notifications.weeklySummary) {
    const { rows } = await pool.query("SELECT count(*)::int AS completed FROM lesson_progress WHERE user_id = $1 AND completed_at >= now() - interval '7 days' AND status = 'completed'", [userId]);
    reminders.push({ id: 'weekly', text: `${rows[0].completed} lesson checkpoints currently marked complete in the last seven days.`, href: '/app/roadmap' });
  }
  if (settings.notifications.moduleCompletion) {
    const { rows } = await pool.query("SELECT week_number FROM user_progress WHERE user_id = $1 AND completion_status = 'completed' AND updated_at >= now() - interval '7 days' ORDER BY week_number", [userId]);
    for (const row of rows) reminders.push({ id: `module:${row.week_number}`, text: `Week ${row.week_number} is marked complete.`, href: `/app/weeks/${row.week_number}` });
  }
  return reminders;
}
# Codex Prompt — Complete Account Settings Redesign and Functional Settings System

## Project Context

**Repository:** https://github.com/Primalpancake92/DSA-study-buddy

**Technology stack:**
- React, Vite, Tailwind CSS, React Router
- Node.js and Express
- PostgreSQL (Supabase)
- Session-based authentication
- Vercel frontend and Render backend

## Objective

Redesign and expand the Account Settings page into a professional, fully functional settings interface.

The existing page displays Profile Information and Account Security as two large cards positioned side by side.

Replace this with a vertical settings navigation sidebar and a single main content panel.

Also introduce settings for learning preferences, connected coding platforms, notifications, appearance, accessibility, and data privacy.

**All implemented controls must have real functionality, persistence where appropriate, and proper error handling. Do not create decorative or nonfunctional settings.**

Inspect the current repository, authentication implementation, database schema, routing architecture, and styling system before making changes.

---

# PART 1 — Account Settings Layout

## 1. Replace the Existing Two-Card Layout

Create a unified Account Settings page with:

- A page heading and short description.
- A vertical navigation sidebar on the left.
- A main settings content area on the right.
- A responsive layout that works on mobile.
- A consistent appearance using the Midnight Indigo palette.

### Target Layout

```text
ACCOUNT SETTINGS

Your settings.
Manage your account, learning experience,
and application preferences.


┌──────────────────────┬───────────────────────────────────────┐
│                      │                                       │
│ ACCOUNT              │ PROFILE INFORMATION                   │
│                      │                                       │
│ ● Profile            │ About you                             │
│   Security           │                                       │
│   Connected Accounts │ First name                            │
│                      │ [________________________________]    │
│ LEARNING             │                                       │
│                      │ Last name                             │
│   Learning Prefs     │ [________________________________]    │
│   Notifications      │                                       │
│   Accessibility      │ Username                              │
│                      │ [________________________________]    │
│ APPLICATION          │                                       │
│                      │ Email                                 │
│   Appearance         │ [________________________________]    │
│   Data & Privacy     │                                       │
│                      │ [ Save changes ]                      │
│                      │                                       │
└──────────────────────┴───────────────────────────────────────┘

← Back to dashboard
```

The content on the right must change when a different sidebar item is selected.

Only one settings section should be displayed at a time.

## 2. Sidebar Design

Group the navigation into three categories.

### Account
- Profile
- Security
- Connected Accounts

### Learning
- Learning Preferences
- Notifications
- Accessibility

### Application
- Appearance
- Data & Privacy

Use suitable Lucide icons.

The sidebar should be approximately 220–260px wide on desktop.

### Active State

The selected item should use:

- Subtle indigo-tinted background.
- Indigo accent indicator.
- Clearly distinguished text.
- Visible keyboard focus state.

Inactive items should use muted text and subtle hover styling.

Avoid oversized navigation buttons or excessive decorative effects.

## 3. Page Alignment and Styling

Preserve the existing Midnight Indigo palette:

| Element | Colour |
|---|---|
| Main background | `#0B1020` |
| Surface | `#151D32` |
| Primary accent | `#6366F1` |
| Accent hover | `#818CF8` |
| Secondary accent | `#22D3EE` |
| Primary text | `#F8FAFC` |
| Secondary text | `#CBD5E1` |
| Muted text | `#94A3B8` |
| Borders | `#303B53` |
| Success | `#34D399` |
| Error | `#FB7185` |

Remove the existing purple offset rectangles behind the settings cards.

Avoid large enclosing cards with excessive borders or shadows.

The sidebar and main content should feel like a natural part of the page.

Align the entire settings layout with the same horizontal margins used throughout the dashboard.

Keep form fields at a comfortable maximum width rather than stretching them across very wide screens.

---

# PART 2 — Account Settings

## 4. Profile

Preserve the existing profile functionality.

Fields:

- First name
- Last name
- Username
- Email
- Member since

Allow users to update supported profile fields.

Keep email read-only unless the application already implements a secure email-change verification flow.

Preserve existing validation, API integration, and error handling.

Display clear success feedback after saving changes.

## 5. Security

Preserve the existing password and verification functionality.

Include:

- Email verification status.
- Current password.
- New password.
- Confirm new password.
- Change Password button.

Ensure password changes use the existing secure password hashing mechanism.

Never store plaintext passwords.

Clear sensitive password fields after a successful password change or when leaving the Security section.

### Active Sessions

Add an Active Sessions subsection if supported by the existing session store.

Display available information such as:

- Current session.
- Approximate last activity.
- Device or browser description, if reliably recorded.
- Session revocation options.

Allow users to terminate other sessions securely.

Do not invent device information or claim session-management capabilities that the current backend does not support.

If additional session metadata is required, implement it through a documented and secure migration.

## 6. Connected Accounts

Create a Connected Accounts settings page for coding practice platforms.

Support:

- LeetCode
- HackerRank

Allow users to save their public profile URLs or usernames.

Validate the inputs and normalise supported URLs.

Store connections against the authenticated user.

Users must be able to:

- Add a profile.
- Update a profile.
- Remove a profile.
- Open the public profile.

Do not request LeetCode or HackerRank passwords.

Do not claim that linking a username automatically enables submission synchronisation.

Only implement automatic syncing if an officially supported, authorised integration is available.

Otherwise, continue using the application's manual problem-progress tracking.

---

# PART 3 — Learning Settings

## 7. Learning Preferences

Create a functional Learning Preferences page.

Allow users to configure:

### Daily Study Goal

Options such as:

- 15 minutes
- 30 minutes
- 45 minutes
- 60 minutes
- Custom duration

### Weekly Study Frequency

Allow users to choose how many days per week they intend to study.

### Preferred Difficulty

Options:

- Beginner
- Intermediate
- Advanced
- Adaptive

### Learning Experience

Allow users to configure:

- Show hints before solutions.
- Hide solutions until explicitly revealed.
- Prefer step-by-step explanations.
- Enable recommended revision exercises.
- Show estimated completion times.

### Problem Recommendations

Use saved preferences to influence the selection and ordering of recommended problems where practical.

Do not change the underlying curriculum based solely on user preferences.

Persist settings in PostgreSQL.

Load saved settings when the user signs in.

Ensure these preferences actually affect the corresponding learning components.

## 8. Notifications

Create a Notifications settings page.

Allow users to configure:

- Study reminders.
- Spaced repetition reminders.
- Weekly progress summaries.
- Module completion notifications.
- Product updates, if applicable.

Distinguish between in-app notifications and email notifications.

Only enable notification channels that are actually implemented.

### Email Notifications

If email reminders are implemented, reuse the existing Resend integration.

Respect user opt-in preferences.

Provide an unsubscribe mechanism for nonessential email communications.

Do not introduce recurring background jobs without a documented scheduling and deployment approach.

### In-App Notifications

If supported, display relevant learning reminders within the application.

Ensure notification preferences persist.

Do not display toggles that imply notifications are being delivered when no delivery mechanism exists.

---

# PART 4 — Appearance and Accessibility

## 9. Appearance

Create an Appearance settings page.

Allow users to choose between:

- Dark mode.
- Light mode.
- System preference.

The existing Midnight Indigo palette should remain the default dark theme.

Create a complementary light palette that maintains the application's visual identity.

Apply the selected theme consistently across:

- Dashboard.
- Roadmap.
- Modules.
- Lessons.
- Account settings.
- Modals.
- Navigation.
- Forms.
- Code blocks.

Persist the theme preference.

Avoid a flash of the incorrect theme during application startup.

### Code Editor Appearance

Where the application includes code editors or syntax-highlighted examples, ensure they adapt appropriately to the selected theme.

Do not sacrifice code readability.

## 10. Accessibility and Reading Preferences

Create an Accessibility settings page.

This is particularly important because DSA Study Buddy contains extensive textbook-style lessons.

Support:

### Font Size

Allow users to choose:

- Small
- Default
- Large
- Extra Large

### Reading Width

Allow users to select:

- Narrow
- Comfortable
- Wide

### Line Spacing

Provide comfortable reading-density options.

### Reduced Motion

Allow users to reduce nonessential animations and transitions.

Respect the operating system's `prefers-reduced-motion` setting.

### Additional Accessibility

Consider:

- Enhanced contrast.
- Visible keyboard focus indicators.
- Accessible interactive diagrams.
- Clear error messaging.
- Screen-reader-compatible form controls.

Apply saved reading preferences to the actual lesson content.

Do not change the font size of the entire application when the setting is intended only for textbook reading.

---

# PART 5 — Data and Privacy

## 11. Data Export

Create a Data & Privacy settings page.

Allow users to export their own learning data.

Include, where available:

- Account profile information.
- Completed modules.
- Learning progress.
- Practice problem statuses.
- Revision history.
- Personal notes.
- Saved preferences.

Support JSON export, and CSV for suitable tabular datasets.

Do not include:

- Password hashes.
- Session identifiers.
- CSRF tokens.
- Email verification tokens.
- Internal authentication secrets.

Exports must be scoped to the authenticated user.

## 12. Account Deletion

Provide a clearly separated danger zone.

Allow users to request permanent account deletion.

Requirements:

1. Explain what information will be deleted.
2. Require explicit confirmation.
3. Require recent authentication or password re-entry where appropriate.
4. Delete or anonymise associated records according to documented retention requirements.
5. Revoke active sessions.
6. Prevent access after deletion.
7. Handle related database records safely.
8. Provide clear success or failure feedback.

Do not implement deletion as a frontend-only action.

Do not silently delete accounts or expose this action through an easily misclicked button.

---

# PART 6 — Routing and Component Architecture

## 13. Use Nested Settings Routes

Prefer URL-based navigation.

Suggested routes:

```text
/account/settings/profile
/account/settings/security
/account/settings/connections
/account/settings/learning
/account/settings/notifications
/account/settings/accessibility
/account/settings/appearance
/account/settings/privacy
```

Adapt these paths to the existing router.

Requirements:

- Profile is the default section.
- Refreshing preserves the selected section.
- Browser Back and Forward navigation work.
- Sidebar active state follows the current route.
- All settings routes require authentication.
- Existing global navigation remains unchanged.

Use a shared Account Settings layout with an `<Outlet />` if appropriate.

## 14. Component Structure

Use reusable components with clear responsibilities.

Suggested structure:

```text
components/account/
  AccountSettingsSidebar.jsx
  SettingsSection.jsx
  SettingsField.jsx

pages/account/
  AccountSettingsLayout.jsx
  ProfileSettings.jsx
  SecuritySettings.jsx
  ConnectedAccountsSettings.jsx
  LearningPreferencesSettings.jsx
  NotificationSettings.jsx
  AccessibilitySettings.jsx
  AppearanceSettings.jsx
  DataPrivacySettings.jsx
```

Adapt the structure to existing project conventions.

Keep API requests and persistence logic separate from presentation components.

Avoid creating one enormous Account Settings component.

---

# PART 7 — Persistence and Backend Integration

## 15. Database Design

Inspect the existing database schema before creating new tables.

Reuse existing user and preference records where appropriate.

For new preferences, use a suitable user-scoped settings structure.

Potential categories:

- Learning preferences.
- Notification preferences.
- Appearance preferences.
- Accessibility preferences.
- Connected coding profiles.

Use versioned database migrations.

Provide appropriate defaults for existing users.

Ensure migrations are safe to rerun.

## 16. API Security

All settings endpoints must:

- Require authentication.
- Scope data to the authenticated user.
- Validate incoming data.
- Use parameterised queries.
- Preserve CSRF protection.
- Return appropriate HTTP status codes.
- Avoid exposing sensitive information.

Never trust a user ID supplied by the frontend to determine whose settings are being updated.

Use the authenticated session.

---

# PART 8 — Responsive Design

## 17. Mobile Layout

On desktop:

- Sidebar on the left.
- Selected settings content on the right.

On tablets and mobile devices:

- Convert the sidebar into a compact navigation menu, segmented list, or horizontally scrollable tabs.
- Preserve clear category organisation.
- Keep forms full-width within appropriate page padding.
- Avoid horizontal overflow.
- Keep destructive actions visually distinct.

Do not introduce unnecessary nested scrolling.

---

# PART 9 — Testing

## 18. Navigation Tests

Verify:

- Profile loads by default.
- Every sidebar item opens the correct page.
- Only one settings section is visible at a time.
- Active navigation styling is correct.
- Direct URLs work.
- Browser Back and Forward navigation work.
- Mobile navigation works.

## 19. Functional Tests

Verify:

- Profile changes persist.
- Password changes remain secure.
- Connected account details can be saved and removed.
- Learning preferences persist and affect the learning experience.
- Notification preferences persist and are honoured.
- Theme selection persists and applies across pages.
- Reading preferences affect lesson rendering.
- Data export contains only the authenticated user's permitted data.
- Account deletion requires confirmation and works safely.
- Session revocation works if implemented.

## 20. Security Tests

Verify:

- Unauthenticated users cannot access settings.
- Users cannot modify another user's preferences.
- Password hashes and secrets are never returned in settings APIs.
- CSRF protection remains functional.
- Input validation rejects malformed values.
- Sensitive data is excluded from exports.

Run the relevant automated tests and production build.

Report actual results rather than assuming success.

---

# PART 10 — Implementation Strategy

This is a substantial feature expansion.

Implement it in logical stages:

**Stage 1 — Layout and Navigation**
- Replace side-by-side cards.
- Implement the vertical sidebar.
- Add nested routes.
- Preserve Profile and Security functionality.

**Stage 2 — Learning and Appearance**
- Learning Preferences.
- Appearance.
- Accessibility.
- Database persistence.
- Integration with lesson and practice components.

**Stage 3 — Connected Accounts**
- LeetCode and HackerRank profile linking.
- Input validation.
- Persistent storage.

**Stage 4 — Notifications**
- Notification preferences.
- Actual supported delivery mechanisms.
- Reminder integration.

**Stage 5 — Data and Privacy**
- Secure data export.
- Account deletion.
- Session management enhancements where appropriate.

Complete and test each stage before moving to the next.

Do not introduce empty settings pages that appear functional.

If implementation cannot be completed in one pass, report exactly what has been completed and what remains.

---

# Final Deliverables

Provide:

1. Summary of the Account Settings redesign.
2. New component and routing structure.
3. Settings implemented and their actual functionality.
4. Database migrations.
5. API endpoints added or modified.
6. Tests executed and results.
7. Any required environment variables.
8. Remaining limitations or unfinished work.

## Acceptance Criteria

The final Account Settings experience must:

- Use a clean, vertical sidebar layout.
- Display only the selected settings section.
- Follow the Midnight Indigo design system.
- Remove the previous decorative purple card shadows.
- Align consistently with the application's page margins.
- Support Profile, Security, Connected Accounts, Learning Preferences, Notifications, Accessibility, Appearance, and Data & Privacy.
- Persist user preferences securely.
- Apply preferences to the actual learning experience.
- Work across desktop and mobile.
- Preserve authentication and existing application functionality.

**The goal is to make Account Settings feel like a complete, production-quality settings system rather than a collection of disconnected forms. Prioritise working functionality, accessibility, maintainability, and security.**