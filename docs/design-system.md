# Midnight Indigo

`frontend/src/styles/tokens.css` owns all palette and font values. Existing layout styles, reader styles and roadmap styles consume those variables. `theme.css` applies semantic component states; Tailwind aliases reference the same variables instead of maintaining a second palette.

Background is #0B1020; surfaces #151D32; the core accent #6366F1, hover/link accent #818CF8, and focus highlight #22D3EE. Body, heading and metadata use separate slate-white tokens. Emerald means completed, amber means attention, and rose means errors/destructive actions. Labels and checkmarks retain non-colour status information.

Small white button labels use #5B5EE7 (primary-action) rather than the core accent: white on #6366F1 is approximately 4.47:1; the action shade reaches approximately 5.00:1. Hover buttons use dark text on the lighter indigo. Automated tests calculate WCAG contrast for normal text/status/link pairs on background, surface and code backgrounds, and action labels. This is not a full accessibility certification.

Inter and JetBrains Mono load through a single Google Fonts stylesheet with display=swap and limited weights; system UI and monospace fallbacks work when external fonts are blocked. No font or UI package was added.

The roadmap is transparent and borderless at its outer boundary, with subtle connectors and consistent state borders. The reader uses the same background and tokens without paragraph cards. Authentication forms keep dark inputs with clear focus and validation states. This change does not alter sessions, APIs, environment variables or database records.
